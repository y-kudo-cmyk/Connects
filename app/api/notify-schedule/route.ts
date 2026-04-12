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
async function morningNotification(currentTime: string, today: string) {
  // notif_morning_on=true かつ notif_morning_time が現在時刻のユーザー
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('notif_morning_on', true)
    .eq('notif_morning_time', currentTime)

  if (!users || users.length === 0) return { type: 'morning', skipped: true }

  // 今日のイベントを取得
  const { data: events } = await supabase
    .from('events')
    .select('event_title, sub_event_title, tag, start_date, end_date')
    .lte('start_date', today + 'T23:59:59')
    .order('start_date')

  const todayEvents = (events || []).filter(e => {
    const startDate = e.start_date?.slice(0, 10)
    const endDate = e.end_date?.slice(0, 10) || startDate
    return startDate && startDate <= today && today <= endDate!
  })

  if (todayEvents.length === 0) return { type: 'morning', skipped: true, reason: 'no events' }

  const liveEvents = todayEvents.filter(e => e.tag === 'LIVE')
  const ticketEvents = todayEvents.filter(e => e.tag === 'TICKET')

  let content = `📅 今日のスケジュール ${todayEvents.length}件`
  if (liveEvents.length > 0) {
    content += `\n🎤 ${liveEvents[0].event_title}${liveEvents[0].sub_event_title ? ' — ' + liveEvents[0].sub_event_title : ''}`
  }
  if (ticketEvents.length > 0) {
    content += `\n🎫 ${ticketEvents[0].event_title}${ticketEvents[0].sub_event_title ? ' — ' + ticketEvents[0].sub_event_title : ''}`
  }
  if (todayEvents.length > 2) {
    content += `\n...他${todayEvents.length - 2}件`
  }

  const userIds = users.map(u => u.id)
  const result = await sendNotification(userIds, '📅 今日のスケジュール', content, 'https://connects-nu.vercel.app/schedule')
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

  const { data: events } = await supabase
    .from('events')
    .select('event_title, sub_event_title, tag, start_date')
    .gte('start_date', tomorrowStr + 'T00:00:00')
    .lte('start_date', tomorrowStr + 'T23:59:59')

  // 今日締切のイベント
  const { data: endingEvents } = await supabase
    .from('events')
    .select('event_title, sub_event_title, tag, end_date')
    .gte('end_date', today + 'T00:00:00')
    .lte('end_date', today + 'T23:59:59')
    .in('tag', ['TICKET'])

  const tomorrowEvents = events || []
  const ending = endingEvents || []

  if (tomorrowEvents.length === 0 && ending.length === 0) {
    return { type: 'evening', skipped: true, reason: 'no events' }
  }

  let content = ''
  if (ending.length > 0) {
    content += `⏰ 今日締切: ${ending[0].event_title}${ending[0].sub_event_title ? ' — ' + ending[0].sub_event_title : ''}`
    if (ending.length > 1) content += ` 他${ending.length - 1}件`
  }
  if (tomorrowEvents.length > 0) {
    if (content) content += '\n'
    content += `📅 明日: ${tomorrowEvents[0].event_title}${tomorrowEvents[0].sub_event_title ? ' — ' + tomorrowEvents[0].sub_event_title : ''}`
    if (tomorrowEvents.length > 1) content += ` 他${tomorrowEvents.length - 1}件`
  }

  const userIds = users.map(u => u.id)
  const result = await sendNotification(userIds, '🔔 締切＆明日のスケジュール', content, 'https://connects-nu.vercel.app/schedule')
  return { type: 'evening', users: userIds.length, ...result }
}

// ── 3. MYイベントリマインダー ────────────────────────────────
async function myEventReminder(today: string) {
  // notif_event_reminder=true のユーザー
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('notif_event_reminder', true)

  if (!users || users.length === 0) return { type: 'reminder', skipped: true }

  // 明日のイベント（リマインダー = 開始前日）
  const tomorrow = new Date(today + 'T00:00:00Z')
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  for (const user of users) {
    // ユーザーのMYエントリーで明日のもの
    const { data: entries } = await supabase
      .from('my_entries')
      .select('title, date, time')
      .eq('user_id', user.id)
      .gte('date', tomorrowStr)
      .lte('date', tomorrowStr)

    if (!entries || entries.length === 0) continue

    let content = `📌 明日のMYスケジュール\n`
    entries.forEach(e => {
      content += `・${e.title}${e.time ? ' ' + e.time : ''}\n`
    })

    await sendNotification([user.id], '📌 明日のMYスケジュール', content.trim(), 'https://connects-nu.vercel.app/my')
  }

  return { type: 'reminder', users: users.length }
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
    // リマインダーは朝8時に1回だけ
    currentTime === '08:00' ? myEventReminder(date) : { type: 'reminder', skipped: true, reason: 'not 8am' },
  ])

  return NextResponse.json({ time: currentTime, date, results })
}
