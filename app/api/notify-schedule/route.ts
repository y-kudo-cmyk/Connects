export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY!

// ── OneSignal 送信 ───────────────────────────────────────────
async function sendNotification(_userIds: string[], heading: string, content: string, url?: string) {
  // TODO: external_id での個別送信に切り替える（OneSignal login 紐づけ修正後）
  // 現在は全サブスクライバーに送信
  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['All'],
      headings: { en: heading, ja: heading },
      contents: { en: content, ja: content },
      url: url || 'https://connects-nu.vercel.app',
    }),
  })
  const data = await res.json()
  return { success: !data.errors, recipients: data.recipients, id: data.id }
}

// ── 日付ヘルパー（JST） ─────────────────────────────────────
function getJST() {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return {
    date: jst.toISOString().slice(0, 10),
    hour: String(jst.getUTCHours()).padStart(2, '0'),
    minute: String(jst.getUTCMinutes()).padStart(2, '0'),
    time: `${String(jst.getUTCHours()).padStart(2, '0')}:${String(jst.getUTCMinutes()).padStart(2, '0')}`,
  }
}

function formatMD(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ── 1. 朝の通知 ─────────────────────────────────────────────
async function morningNotification(currentTime: string, today: string, testMode = false) {
  let query = supabase.from('profiles').select('id').eq('notif_morning_on', true)
  if (!testMode) query = query.eq('notif_morning_time', currentTime)
  const { data: users } = await query

  if (!users || users.length === 0) return { type: 'morning', skipped: true }

  // 今日のイベントを取得（単日 + 期間）
  const [{ data: singleDay }, { data: periodEvents }] = await Promise.all([
    // 今日開始のイベント
    supabase.from('events')
      .select('event_title, sub_event_title, tag, start_date, end_date')
      .gte('start_date', today + 'T00:00:00')
      .lte('start_date', today + 'T23:59:59'),
    // 期間中のイベント（start <= today AND end >= today）
    supabase.from('events')
      .select('event_title, sub_event_title, tag, start_date, end_date')
      .lte('start_date', today + 'T23:59:59')
      .gte('end_date', today + 'T00:00:00'),
  ])
  // 重複排除してマージ
  const seen = new Set<string>()
  const todayEvents = [...(singleDay || []), ...(periodEvents || [])].filter(e => {
    const key = e.event_title + e.start_date
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (todayEvents.length === 0) return { type: 'morning', skipped: true, reason: 'no events' }

  const liveEvents = todayEvents.filter(e => e.tag === 'LIVE')
  const ticketEvents = todayEvents.filter(e => e.tag === 'TICKET')

  const tagIcon: Record<string, string> = { LIVE: '🎤', TICKET: '🎫', CD: '💿', TV: '📺', POPUP: '🏪', MERCH: '🛒', MAGAZINE: '📖', EVENT: '❤️', LIVEVIEWING: '🎬', INFO: '📢', RADIO: '📻', YOUTUBE: '▶️' }
  const lines: string[] = []
  for (const e of todayEvents.slice(0, 4)) {
    const icon = tagIcon[e.tag] || '📌'
    const title = e.event_title + (e.sub_event_title ? ' — ' + e.sub_event_title : '')
    lines.push(`${icon} ${title}`)
  }
  if (todayEvents.length > 4) lines.push(`...他${todayEvents.length - 4}件`)

  const content = lines.join('\n')
  const heading = `📅 今日のスケジュール ${todayEvents.length}件`

  const userIds = users.map(u => u.id)
  const result = await sendNotification(userIds, heading, content, 'https://connects-nu.vercel.app/')
  return { type: 'morning', users: userIds.length, ...result }
}

// ── 2. 夜の通知 ─────────────────────────────────────────────
async function eveningNotification(currentTime: string, today: string, testMode = false) {
  let query = supabase.from('profiles').select('id').eq('notif_evening_on', true)
  if (!testMode) query = query.eq('notif_evening_time', currentTime)
  const { data: users } = await query

  if (!users || users.length === 0) return { type: 'evening', skipped: true }

  // 明日のイベント
  const tomorrow = new Date(today + 'T00:00:00Z')
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  // 明日のイベント（単日 + 期間）
  const [{ data: tmrSingle }, { data: tmrPeriod }] = await Promise.all([
    supabase.from('events')
      .select('event_title, sub_event_title, tag, start_date, end_date')
      .gte('start_date', tomorrowStr + 'T00:00:00')
      .lte('start_date', tomorrowStr + 'T23:59:59'),
    supabase.from('events')
      .select('event_title, sub_event_title, tag, start_date, end_date')
      .lte('start_date', tomorrowStr + 'T23:59:59')
      .gte('end_date', tomorrowStr + 'T00:00:00'),
  ])
  const tmrSeen = new Set<string>()
  const tomorrowEvents = [...(tmrSingle || []), ...(tmrPeriod || [])].filter(e => {
    const key = e.event_title + e.start_date
    if (tmrSeen.has(key)) return false
    tmrSeen.add(key)
    return true
  })

  // 今日締切のイベント
  const { data: endingEvents } = await supabase
    .from('events')
    .select('event_title, sub_event_title, tag, end_date')
    .gte('end_date', today + 'T00:00:00')
    .lte('end_date', today + 'T23:59:59')
    .in('tag', ['TICKET'])

  const ending = endingEvents || []

  if (tomorrowEvents.length === 0 && ending.length === 0) {
    return { type: 'evening', skipped: true, reason: 'no events' }
  }

  // ヘッディングに要点を詰める（iPhoneは本文が見えにくいため）
  let heading = ''
  if (ending.length > 0) {
    heading = `⏰ 今日締切: ${ending[0].event_title.slice(0, 20)}`
    if (ending.length > 1) heading += ` 他${ending.length - 1}件`
  } else if (tomorrowEvents.length > 0) {
    heading = `🌙 明日${tomorrowEvents.length}件`
  }

  const tagIcon: Record<string, string> = { LIVE: '🎤', TICKET: '🎫', CD: '💿', TV: '📺', POPUP: '🏪', MERCH: '🛒', MAGAZINE: '📖', EVENT: '❤️', LIVEVIEWING: '🎬', INFO: '📢', RADIO: '📻', YOUTUBE: '▶️' }
  const parts: string[] = []
  if (ending.length > 0) parts.push(`⏰締切${ending.length}件`)
  if (tomorrowEvents.length > 0) {
    const top = tomorrowEvents[0]
    const icon = tagIcon[top.tag] || '📌'
    parts.push(`${icon}${top.event_title.slice(0, 25)}${tomorrowEvents.length > 1 ? ` 他${tomorrowEvents.length - 1}件` : ''}`)
  }
  const content = parts.join(' / ')

  const userIds = users.map(u => u.id)
  const result = await sendNotification(userIds, heading, content, 'https://connects-nu.vercel.app/')
  return { type: 'evening', users: userIds.length, ...result }
}

// ── LINE Push (OneSignal と併用) ─────────────────────────────
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
async function sendLinePush(to: string, text: string) {
  if (!LINE_TOKEN) return false
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
    })
    return res.ok
  } catch { return false }
}

// ── 3. MYイベントリマインダー（1時間前） ─────────────────────
async function myEventReminder(currentTime: string, today: string) {
  const { data: users } = await supabase
    .from('profiles')
    .select('id, line_user_id')
    .eq('notif_event_reminder', true)

  if (!users || users.length === 0) return { type: 'reminder', skipped: true }

  // 現在時刻の1時間後 = リマインダー対象の開始時刻
  // cron は :00 / :30 に発火するので、:00 なら次時間の :00、:30 なら次時間の :30 のイベントがヒットする
  const [h, m] = currentTime.split(':').map(Number)
  const targetHour = String(h + 1).padStart(2, '0')
  const targetMinute = String(m).padStart(2, '0')
  const targetTime = `${targetHour}:${targetMinute}`

  let sent = 0
  let lineSent = 0
  for (const user of users) {
    const { data: entries } = await supabase
      .from('my_entries')
      .select('event_title, sub_event_title, tag, start_date, end_date, source_url, spot_name')
      .eq('user_id', user.id)

    if (!entries || entries.length === 0) continue

    // 今日の、1時間後に開始するイベントを抽出（LIVE は除外）
    const upcomingStart = entries.filter(e => {
      if (!e.start_date) return false
      if (e.tag === 'LIVE') return false
      const date = e.start_date.slice(0, 10)
      const time = e.start_date.slice(11, 16)
      return date === today && time === targetTime
    })

    // TICKET のみ、1時間後に終了するイベントを抽出
    const upcomingEnd = entries.filter(e => {
      if (e.tag !== 'TICKET') return false
      if (!e.end_date) return false
      const date = e.end_date.slice(0, 10)
      const time = e.end_date.slice(11, 16)
      return date === today && time === targetTime
    })

    if (upcomingStart.length === 0 && upcomingEnd.length === 0) continue

    // OneSignal
    if (upcomingStart.length > 0) {
      const content = upcomingStart.map(e => `・${e.event_title} ${targetTime}〜`).join('\n')
      await sendNotification([user.id], '⏰ まもなく開始', content, 'https://connects-nu.vercel.app/my')
      sent++
    }
    if (upcomingEnd.length > 0) {
      const content = upcomingEnd.map(e => `・${e.event_title} ${targetTime}締切`).join('\n')
      await sendNotification([user.id], '⏰ まもなく終了', content, 'https://connects-nu.vercel.app/my')
      sent++
    }

    // LINE Push (line_user_id がある場合)
    if (user.line_user_id) {
      for (const e of upcomingStart) {
        let msg = `⚡ まもなく開始！\n\n${e.event_title}\n`
        if (e.sub_event_title) msg += `　${e.sub_event_title}\n`
        msg += `🕐 ${targetTime}〜\n`
        if (e.spot_name) msg += `📍 ${e.spot_name}\n`
        if (e.source_url) msg += `\n🔗 ${e.source_url}\n`
        msg += `\n━━━━━━━━━━\nConnect+\nhttps://connects-nu.vercel.app/my`
        if (await sendLinePush(user.line_user_id, msg)) lineSent++
      }
      for (const e of upcomingEnd) {
        let msg = `⚠️ まもなく終了！\n\n${e.event_title}\n`
        if (e.sub_event_title) msg += `　${e.sub_event_title}\n`
        msg += `🕐 ${targetTime} 締切\n`
        if (e.source_url) msg += `\n🔗 ${e.source_url}\n`
        msg += `\n━━━━━━━━━━\nConnect+\nhttps://connects-nu.vercel.app/my`
        if (await sendLinePush(user.line_user_id, msg)) lineSent++
      }
    }
  }

  return { type: 'reminder', users: sent, lineSent }
}

// ── API Route（毎時 Cron で呼ばれる） ────────────────────────
export async function GET(request: NextRequest) {
  // Vercel Cron 認証
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // ローカルテスト用: CRON_SECRET が未設定なら通す
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { date, time } = getJST()
  const testMode = request.nextUrl.searchParams.get('test') === 'true'
  const currentTime = time // "13:00" 形式

  const results = await Promise.all([
    morningNotification(currentTime, date, testMode),
    eveningNotification(currentTime, date, testMode),
    // リマインダーは毎時実行（1時間前通知）
    myEventReminder(currentTime, date),
  ])

  return NextResponse.json({ time: currentTime, date, results })
}
