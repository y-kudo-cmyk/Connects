export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const FANDOM = 'CARAT'
const ARTIST = 'SEVENTEEN'
const FOOTER = '\n━━━━━━━━━━\nConnect+\nhttps://app.connectsplus.net/'

// JST の今日・昨日の YYYY-MM-DD
function jstDate(offsetDays = 0): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000 + offsetDays * 86400000)
  return d.toISOString().slice(0, 10)
}

function formatMD(isoStr: string): string {
  const m = isoStr.match(/(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${Number(m[2])}/${Number(m[3])}` : ''
}

function formatTime(isoStr: string): string {
  const m = isoStr.match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : ''
}

const TAG_ICON: Record<string, string> = {
  LIVE: '🎤', TICKET: '🎫', CD: '💿', TV: '📺', POPUP: '🏪',
  MERCH: '🛒', MAGAZINE: '📖', EVENT: '❤️', LIVEVIEWING: '🎬',
  INFO: '📢', RADIO: '📻', YOUTUBE: '▶️', BIRTHDAY: '🎂',
}

async function sendLinePush(to: string, text: string) {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
    })
    return res.ok
  } catch { return false }
}

type Event = {
  event_title: string
  sub_event_title: string | null
  tag: string
  start_date: string
  end_date: string | null
  source_url: string | null
  spot_name: string | null
  created_at: string
}

function formatEvent(e: Event, options: { useAlarm?: boolean; warning?: boolean } = {}): string {
  const icon = options.useAlarm ? '⏰' : options.warning ? `⚠️${TAG_ICON[e.tag] || '📌'}` : (TAG_ICON[e.tag] || '📌')
  const startTime = formatTime(e.start_date)
  const endTime = e.end_date ? formatTime(e.end_date) : ''
  const startMD = formatMD(e.start_date)
  const endMD = e.end_date ? formatMD(e.end_date) : ''
  const hasStartTime = startTime && startTime !== '00:00'
  const hasEndTime = endTime && endTime !== '00:00'
  let displayDate: string
  if (endMD && endMD !== startMD) {
    // 期間イベント
    const startPart = hasStartTime ? `${startMD} ${startTime}` : startMD
    const endPart = hasEndTime ? `${endMD} ${endTime}` : endMD
    displayDate = `${startPart}〜${endPart}`
  } else {
    // 単日
    displayDate = hasStartTime ? `${startMD} ${startTime}` : startMD
  }
  const title = e.event_title
  const sub = e.sub_event_title ? `\n　${e.sub_event_title}` : ''
  const tagLabel = options.useAlarm ? `【${e.tag}】` : ''
  const src = e.source_url ? `\n🔗 ${e.source_url}` : ''
  return `\n${icon} ${displayDate}${tagLabel}\n${title}${sub}${src}\n`
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  // CRON_SECRET 必須
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = jstDate()
  const yesterday = jstDate(-1)
  const testMode = request.nextUrl.searchParams.get('test') === 'true'

  // 今日のイベント (単日 + 期間) — status=confirmed 絞り込み（ある場合）
  const [{ data: singleDay }, { data: periodEvents }, { data: newlyAdded }] = await Promise.all([
    supabase.from('events')
      .select('event_title, sub_event_title, tag, start_date, end_date, source_url, spot_name, created_at')
      .gte('start_date', today + 'T00:00:00')
      .lte('start_date', today + 'T23:59:59'),
    supabase.from('events')
      .select('event_title, sub_event_title, tag, start_date, end_date, source_url, spot_name, created_at')
      .lte('start_date', today + 'T23:59:59')
      .gte('end_date', today + 'T00:00:00'),
    // 新着: 昨日追加された、かつ未来開催のもの
    supabase.from('events')
      .select('event_title, sub_event_title, tag, start_date, end_date, source_url, spot_name, created_at')
      .gte('created_at', yesterday + 'T00:00:00+09:00')
      .lt('created_at', today + 'T00:00:00+09:00')
      .gte('start_date', today + 'T00:00:00'),
  ])

  const seen = new Set<string>()
  const todayEvents = [...(singleDay || []), ...(periodEvents || [])]
    .filter((e: Event) => e.tag !== 'BIRTHDAY')
    .filter((e: Event) => {
      const key = `${e.event_title}::${e.start_date}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }) as Event[]

  const newEvents = (newlyAdded || []).filter((e: Event) => e.tag !== 'BIRTHDAY') as Event[]

  if (todayEvents.length === 0 && newEvents.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no events', date: today })
  }

  // 本日まで（期間の最終日）— TICKET → POPUP → MERCH → その他 の順
  const LAST_DAY_ORDER: Record<string, number> = { TICKET: 0, POPUP: 1, MERCH: 2 }
  const lastDayEvents = todayEvents
    .filter(e => e.end_date && e.end_date.slice(0, 10) === today)
    .sort((a, b) => {
      const ra = LAST_DAY_ORDER[a.tag] ?? 99
      const rb = LAST_DAY_ORDER[b.tag] ?? 99
      return ra - rb
    })
  // 本日のみ
  const todayOnly = todayEvents
    .filter(e => !e.end_date)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
  // 期間中
  const periodOngoing = todayEvents.filter(e => e.end_date && e.end_date.slice(0, 10) !== today)

  let message = `${FANDOM}の皆さん、\n`
  message += `おはようございます☀️\n`
  message += `${formatMD(today + 'T00:00:00')} ${ARTIST}の本日のスケジュールをお知らせします。\n`

  if (lastDayEvents.length > 0) {
    message += `\n【本日まで】\n`
    for (const e of lastDayEvents) message += formatEvent(e, { warning: true })
  }

  const scheduleEvents = [...todayOnly, ...periodOngoing]
  if (scheduleEvents.length > 0) {
    message += `\n【本日のスケジュール】\n`
    for (const e of scheduleEvents) {
      const hasTime = formatTime(e.start_date) !== '00:00'
      const isTodayOnly = !e.end_date
      message += formatEvent(e, { useAlarm: hasTime && isTodayOnly })
    }
  }

  if (newEvents.length > 0) {
    message += `\n━━━━━━━━━━\n【新着スケジュール】\n`
    for (const e of newEvents) message += formatEvent(e)
    message += `\n📅 マイカレンダーへの追加お忘れなく！\n`
  }

  message += FOOTER
  message = message.slice(0, 4900)

  // LINE ID を profiles + glide_users から集約
  const [{ data: pIds }, { data: gIds }] = await Promise.all([
    supabase.from('profiles').select('line_user_id').not('line_user_id', 'is', null).neq('line_user_id', ''),
    supabase.from('glide_users').select('line_user_id').not('line_user_id', 'is', null).neq('line_user_id', ''),
  ])
  const ids = new Set<string>()
  for (const r of pIds || []) if (r.line_user_id) ids.add(r.line_user_id)
  for (const r of gIds || []) if (r.line_user_id) ids.add(r.line_user_id)
  const lineIds = Array.from(ids)
  const targets = testMode ? lineIds.slice(0, 1) : lineIds

  let sent = 0
  let failed = 0
  // 30件ずつ並列送信（LINE push APIは高レート許容、Vercelタイムアウト回避）
  const BATCH = 30
  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH)
    const results = await Promise.all(batch.map((id) => sendLinePush(id, message)))
    for (const r of results) { if (r) sent++; else failed++ }
  }

  return NextResponse.json({
    ok: true,
    date: today,
    todayEvents: todayEvents.length,
    newEvents: newEvents.length,
    totalTargets: lineIds.length,
    sent,
    failed,
    testMode,
  })
}
