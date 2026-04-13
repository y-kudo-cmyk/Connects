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
      url: url || 'https://connects-git-kudodev-y-kudo-cmyks-projects.vercel.app',
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
async function morningNotification(currentTime: string, today: string) {
  // notif_morning_on=true かつ notif_morning_time が現在時刻のユーザー
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('notif_morning_on', true)
    .eq('notif_morning_time', currentTime)

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
  const result = await sendNotification(userIds, heading, content, 'https://connects-git-kudodev-y-kudo-cmyks-projects.vercel.app/')
  return { type: 'morning', users: userIds.length, ...result }
}

// ── 2. 夜の通知 ─────────────────────────────────────────────
async function eveningNotification(currentTime: string, today: string) {
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('notif_evening_on', true)
    .eq('notif_evening_time', currentTime)

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

  const tagIcon: Record<string, string> = { LIVE: '🎤', TICKET: '🎫', CD: '💿', TV: '📺', POPUP: '🏪', MERCH: '🛒', MAGAZINE: '📖', EVENT: '❤️', LIVEVIEWING: '🎬', INFO: '📢', RADIO: '📻', YOUTUBE: '▶️' }
  const lines: string[] = []
  if (ending.length > 0) {
    lines.push('⏰ 今日締切:')
    for (const e of ending.slice(0, 2)) {
      lines.push(`  🎫 ${e.event_title}${e.sub_event_title ? ' — ' + e.sub_event_title : ''}`)
    }
    if (ending.length > 2) lines.push(`  ...他${ending.length - 2}件`)
  }
  if (tomorrowEvents.length > 0) {
    lines.push(`📅 明日のスケジュール ${tomorrowEvents.length}件:`)
    for (const e of tomorrowEvents.slice(0, 3)) {
      const icon = tagIcon[e.tag] || '📌'
      lines.push(`  ${icon} ${e.event_title}${e.sub_event_title ? ' — ' + e.sub_event_title : ''}`)
    }
    if (tomorrowEvents.length > 3) lines.push(`  ...他${tomorrowEvents.length - 3}件`)
  }

  const content = lines.join('\n')
  const heading = ending.length > 0 ? '⏰ 締切あり！明日のスケジュール' : `🌙 明日のスケジュール ${tomorrowEvents.length}件`

  const userIds = users.map(u => u.id)
  const result = await sendNotification(userIds, heading, content, 'https://connects-git-kudodev-y-kudo-cmyks-projects.vercel.app/')
  return { type: 'evening', users: userIds.length, ...result }
}

// ── 3. MYイベントリマインダー（1時間前） ─────────────────────
async function myEventReminder(currentTime: string, today: string) {
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('notif_event_reminder', true)

  if (!users || users.length === 0) return { type: 'reminder', skipped: true }

  // 現在時刻の1時間後 = リマインダー対象の開始時刻
  const [h, m] = currentTime.split(':').map(Number)
  const targetHour = String(h + 1).padStart(2, '0')
  const targetTime = `${targetHour}:00`

  let sent = 0
  for (const user of users) {
    const { data: entries } = await supabase
      .from('my_entries')
      .select('event_title, start_date')
      .eq('user_id', user.id)

    if (!entries || entries.length === 0) continue

    // 今日の、1時間後に開始するイベントを抽出
    const upcoming = entries.filter(e => {
      if (!e.start_date) return false
      const date = e.start_date.slice(0, 10)
      const time = e.start_date.slice(11, 16)
      return date === today && time === targetTime
    })

    if (upcoming.length === 0) continue

    let content = `⏰ まもなく開始！\n`
    upcoming.forEach(e => {
      content += `・${e.event_title} ${targetTime}〜\n`
    })

    await sendNotification([user.id], '⏰ 1時間後に開始', content.trim(), 'https://connects-git-kudodev-y-kudo-cmyks-projects.vercel.app/my')
    sent++
  }

  return { type: 'reminder', users: sent }
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
  const currentTime = time // "13:00" 形式

  const results = await Promise.all([
    morningNotification(currentTime, date),
    eveningNotification(currentTime, date),
    // リマインダーは毎時実行（1時間前通知）
    myEventReminder(currentTime, date),
  ])

  return NextResponse.json({ time: currentTime, date, results })
}
