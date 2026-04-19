import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

const FANDOM = 'CARAT'
const ARTIST = 'SEVENTEEN'
const FOOTER = '\n━━━━━━━━━━\nConnect+\nhttps://connects-nu.vercel.app/'
const PREFIX = `✨ お知らせ\n\nただいま Connect+ をリニューアル中のため、\n朝のメッセージが一部の方に届かないケースがありました。\n改めて本日のスケジュールをお送りします🙏\n\n━━━━━━━━━━\n\n`

function jstDate(offsetDays = 0) { const d = new Date(Date.now() + 9*60*60*1000 + offsetDays*86400000); return d.toISOString().slice(0, 10) }
const formatMD = (iso) => { const m = iso.match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${Number(m[2])}/${Number(m[3])}` : '' }
const formatTime = (iso) => { const m = iso.match(/T(\d{2}):(\d{2})/); return m ? `${m[1]}:${m[2]}` : '' }
const TAG_ICON = { LIVE: '🎤', TICKET: '🎫', CD: '💿', TV: '📺', POPUP: '🏪', MERCH: '🛒', MAGAZINE: '📖', EVENT: '❤️', LIVEVIEWING: '🎬', INFO: '📢', RADIO: '📻', YOUTUBE: '▶️', BIRTHDAY: '🎂' }
function formatEvent(e, options = {}) {
  const icon = options.useAlarm ? '⏰' : options.warning ? `⚠️${TAG_ICON[e.tag] || '📌'}` : (TAG_ICON[e.tag] || '📌')
  const startTime = formatTime(e.start_date); const endTime = e.end_date ? formatTime(e.end_date) : ''
  const startMD = formatMD(e.start_date); const endMD = e.end_date ? formatMD(e.end_date) : ''
  const hasStartTime = startTime && startTime !== '00:00'; const hasEndTime = endTime && endTime !== '00:00'
  let displayDate
  if (endMD && endMD !== startMD) { displayDate = `${hasStartTime ? `${startMD} ${startTime}` : startMD}〜${hasEndTime ? `${endMD} ${endTime}` : endMD}` }
  else { displayDate = hasStartTime ? `${startMD} ${startTime}` : startMD }
  const sub = e.sub_event_title ? `\n　${e.sub_event_title}` : ''
  const spot = e.spot_name ? `\n　📍${e.spot_name}` : ''
  const tagLabel = options.useAlarm ? `【${e.tag}】` : ''
  return `${icon}${tagLabel}${e.event_title}${sub}\n🕐 ${displayDate}${spot}\n\n`
}

const today = jstDate(), yesterday = jstDate(-1)
const [{ data: singleDay }, { data: periodEvents }, { data: newlyAdded }] = await Promise.all([
  s.from('events').select('event_title, sub_event_title, tag, start_date, end_date, source_url, spot_name, created_at').gte('start_date', today+'T00:00:00').lte('start_date', today+'T23:59:59'),
  s.from('events').select('event_title, sub_event_title, tag, start_date, end_date, source_url, spot_name, created_at').lte('start_date', today+'T23:59:59').gte('end_date', today+'T00:00:00'),
  s.from('events').select('event_title, sub_event_title, tag, start_date, end_date, source_url, spot_name, created_at').gte('created_at', yesterday+'T00:00:00+09:00').lt('created_at', today+'T00:00:00+09:00').gte('start_date', today+'T00:00:00'),
])
const seen = new Set()
const todayEvents = [...(singleDay||[]), ...(periodEvents||[])].filter(e => e.tag !== 'BIRTHDAY').filter(e => { const k = `${e.event_title}::${e.start_date}`; if (seen.has(k)) return false; seen.add(k); return true })
const newEvents = (newlyAdded||[]).filter(e => e.tag !== 'BIRTHDAY')
const LAST_DAY_ORDER = { TICKET: 0, POPUP: 1, MERCH: 2 }
const lastDayEvents = todayEvents.filter(e => e.end_date && e.end_date.slice(0,10) === today).sort((a,b) => (LAST_DAY_ORDER[a.tag]??99)-(LAST_DAY_ORDER[b.tag]??99))
const todayOnly = todayEvents.filter(e => !e.end_date).sort((a,b) => a.start_date.localeCompare(b.start_date))
const periodOngoing = todayEvents.filter(e => e.end_date && e.end_date.slice(0,10) !== today)

let message = PREFIX
message += `${FANDOM}の皆さん、\nおはようございます☀️\n${formatMD(today+'T00:00:00')} ${ARTIST}の本日のスケジュールをお知らせします。\n`
if (lastDayEvents.length) { message += '\n【本日まで】\n'; for (const e of lastDayEvents) message += formatEvent(e, { warning: true }) }
const scheduleEvents = [...todayOnly, ...periodOngoing]
if (scheduleEvents.length) { message += '\n【本日のスケジュール】\n'; for (const e of scheduleEvents) { const hasTime = formatTime(e.start_date) !== '00:00'; const isTodayOnly = !e.end_date; message += formatEvent(e, { useAlarm: hasTime && isTodayOnly }) } }
if (newEvents.length) { message += '\n━━━━━━━━━━\n【新着スケジュール】\n'; for (const e of newEvents) message += formatEvent(e); message += '\n📅 マイカレンダーへの追加お忘れなく！\n' }
message += FOOTER
message = message.slice(0, 4900)

const targets = [
  'Ua43ee250c3f8e680aa710e1df8485e25', // U000078 cui67111
  'Ub041cddace11fd7c6dcb8afa4094d95c', // U000142 saik
  'U2659da5671fc2a2e7dc91a6bee4f73ad', // U001022 izumi-50 - need to check actual ID
  'Ud2f8112d48910520ecd6ada5d43d1d9c', // U001271 ra.li
]

// get actual line_user_ids from DB
const { data: freshIds } = await s.from('glide_users').select('mail, line_user_id').in('membership_number', ['U000078','U000142','U001022','U001271'])
console.log('targets:')
for (const r of freshIds) console.log(`  ${r.mail} | ${r.line_user_id}`)

async function sendLinePush(to, text) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ to, messages: [{ type: 'text', text }] }) })
  return { ok: res.ok, status: res.status, err: res.ok ? null : await res.text() }
}

let sent = 0, failed = 0
for (const r of freshIds) {
  const res = await sendLinePush(r.line_user_id, message)
  if (res.ok) { console.log(`✓ ${r.mail}`); sent++ }
  else { console.log(`✗ ${r.mail} status=${res.status} err=${res.err?.slice(0,100)}`); failed++ }
}
console.log(`\ntotal sent=${sent} failed=${failed}`)
