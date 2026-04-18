export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// JST の今日の日付 (YYYY-MM-DD)
function getJstDate(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

// 指定ユーザーへ LINE Push 送信（失敗は握りつぶす）
async function sendLinePush(to: string, text: string) {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text }],
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

const TAG_ICON: Record<string, string> = {
  LIVE: '🎤', TICKET: '🎫', CD: '💿', TV: '📺', POPUP: '🏪',
  MERCH: '🛒', MAGAZINE: '📖', EVENT: '❤️', LIVEVIEWING: '🎬',
  INFO: '📢', RADIO: '📻', YOUTUBE: '▶️', BIRTHDAY: '🎂',
}

export async function GET(request: NextRequest) {
  // Vercel Cron 認証
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = getJstDate()
  const testMode = request.nextUrl.searchParams.get('test') === 'true'

  // 1. 今日のイベント取得（単日 + 期間）
  const [{ data: singleDay }, { data: periodEvents }] = await Promise.all([
    supabase.from('events')
      .select('event_title, sub_event_title, tag, start_date, end_date, source_url, spot_name')
      .gte('start_date', today + 'T00:00:00')
      .lte('start_date', today + 'T23:59:59'),
    supabase.from('events')
      .select('event_title, sub_event_title, tag, start_date, end_date, source_url, spot_name')
      .lte('start_date', today + 'T23:59:59')
      .gte('end_date', today + 'T00:00:00'),
  ])

  const seen = new Set<string>()
  const todayEvents = [...(singleDay || []), ...(periodEvents || [])]
    .filter(e => e.tag !== 'BIRTHDAY')
    .filter(e => {
      const key = `${e.event_title}::${e.start_date}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  if (todayEvents.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no events', date: today })
  }

  // 2. 本文組み立て
  const lines: string[] = [`📅 今日のスケジュール (${today.slice(5).replace('-', '/')})`]
  lines.push('')
  for (const e of todayEvents) {
    const icon = TAG_ICON[e.tag] || '📌'
    const title = e.event_title + (e.sub_event_title ? ` — ${e.sub_event_title}` : '')
    const venue = e.spot_name ? `\n📍 ${e.spot_name}` : ''
    const src = e.source_url ? `\n🔗 ${e.source_url}` : ''
    lines.push(`${icon} ${title}${venue}${src}`)
    lines.push('')
  }
  const content = lines.join('\n').slice(0, 4900) // LINE単一メッセージ上限 5000字

  // 3. 宛先 LINE ID 集約（profiles + glide_users、重複除去）
  const [{ data: pIds }, { data: gIds }] = await Promise.all([
    supabase.from('profiles').select('line_user_id').not('line_user_id', 'is', null).neq('line_user_id', ''),
    supabase.from('glide_users').select('line_user_id').not('line_user_id', 'is', null).neq('line_user_id', ''),
  ])
  const ids = new Set<string>()
  for (const r of pIds || []) if (r.line_user_id) ids.add(r.line_user_id)
  for (const r of gIds || []) if (r.line_user_id) ids.add(r.line_user_id)
  const lineIds = Array.from(ids)

  // テストモード: 最初の1人だけに送信
  const targets = testMode ? lineIds.slice(0, 1) : lineIds

  // 4. 順次送信（LINE APIレート対策で 100ms インターバル）
  let sent = 0
  for (const id of targets) {
    const ok = await sendLinePush(id, content)
    if (ok) sent++
    await new Promise(r => setTimeout(r, 100))
  }

  return NextResponse.json({
    ok: true,
    date: today,
    events: todayEvents.length,
    totalTargets: lineIds.length,
    sent,
    testMode,
  })
}
