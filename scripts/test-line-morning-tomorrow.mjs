import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

const FANDOM = 'CARAT'
const ARTIST = 'SEVENTEEN'
const FOOTER = '\n━━━━━━━━━━\nConnect+\nhttps://app.connectsplus.net/'
const TAG_ICON = { LIVE: '🎤', TICKET: '🎫', CD: '💿', TV: '📺', POPUP: '🏪', MERCH: '🛒', MAGAZINE: '📖', EVENT: '❤️', LIVEVIEWING: '🎬', INFO: '📢', RADIO: '📻', YOUTUBE: '▶️', BIRTHDAY: '🎂' }

function jstDate(offset = 0) {
  const d = new Date(Date.now() + 9 * 3600 * 1000 + offset * 86400000)
  return d.toISOString().slice(0, 10)
}
function formatMD(iso) { const m = iso.match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${Number(m[2])}/${Number(m[3])}` : '' }
function formatTime(iso) { const m = iso.match(/T(\d{2}):(\d{2})/); return m ? `${m[1]}:${m[2]}` : '' }

function formatEvent(e, opts = {}) {
  const icon = opts.useAlarm ? '⏰' : opts.warning ? `⚠️${TAG_ICON[e.tag] || '📌'}` : (TAG_ICON[e.tag] || '📌')
  const startTime = formatTime(e.start_date)
  const endTime = e.end_date ? formatTime(e.end_date) : ''
  const startMD = formatMD(e.start_date)
  const endMD = e.end_date ? formatMD(e.end_date) : ''
  const hasStartTime = startTime && startTime !== '00:00'
  const hasEndTime = endTime && endTime !== '00:00'
  let displayDate
  if (endMD && endMD !== startMD) {
    const startPart = hasStartTime ? `${startMD} ${startTime}` : startMD
    const endPart = hasEndTime ? `${endMD} ${endTime}` : endMD
    displayDate = `${startPart}〜${endPart}`
  } else {
    displayDate = hasStartTime ? `${startMD} ${startTime}` : startMD
  }
  const sub = e.sub_event_title ? `\n　${e.sub_event_title}` : ''
  const tagLabel = opts.useAlarm ? `【${e.tag}】` : ''
  const src = e.source_url ? `\n🔗 ${e.source_url}` : ''
  return `\n${icon} ${displayDate}${tagLabel}\n${e.event_title}${sub}${src}\n`
}

const tomorrow = jstDate(1)
const today = jstDate()

const [{ data: single }, { data: period }, { data: newly }] = await Promise.all([
  s.from('events').select('*').gte('start_date', tomorrow + 'T00:00:00').lte('start_date', tomorrow + 'T23:59:59'),
  s.from('events').select('*').lte('start_date', tomorrow + 'T23:59:59').gte('end_date', tomorrow + 'T00:00:00'),
  s.from('events').select('*').gte('created_at', today + 'T00:00:00+09:00').lt('created_at', jstDate(1) + 'T00:00:00+09:00').gte('start_date', tomorrow + 'T00:00:00'),
])

const seen = new Set()
const tomorrowEvents = [...(single || []), ...(period || [])]
  .filter(e => e.tag !== 'BIRTHDAY')
  .filter(e => { const k = `${e.event_title}::${e.start_date}`; if (seen.has(k)) return false; seen.add(k); return true })
const newEvents = (newly || []).filter(e => e.tag !== 'BIRTHDAY')

const LAST_DAY_ORDER = { TICKET: 0, POPUP: 1, MERCH: 2 }
const lastDayEvents = tomorrowEvents
  .filter(e => e.end_date && e.end_date.slice(0, 10) === tomorrow)
  .sort((a, b) => (LAST_DAY_ORDER[a.tag] ?? 99) - (LAST_DAY_ORDER[b.tag] ?? 99))
const todayOnly = tomorrowEvents.filter(e => !e.end_date).sort((a, b) => a.start_date.localeCompare(b.start_date))
const periodOngoing = tomorrowEvents.filter(e => e.end_date && e.end_date.slice(0, 10) !== tomorrow)

let message = `${FANDOM}の皆さん、\nおはようございます☀️\n${formatMD(tomorrow + 'T00:00:00')} ${ARTIST}の本日のスケジュールをお知らせします。\n`
if (lastDayEvents.length) { message += `\n【本日まで】\n`; for (const e of lastDayEvents) message += formatEvent(e, { warning: true }) }
const sch = [...todayOnly, ...periodOngoing]
if (sch.length) { message += `\n【本日のスケジュール】\n`; for (const e of sch) message += formatEvent(e, { useAlarm: formatTime(e.start_date) !== '00:00' && !e.end_date }) }
if (newEvents.length) { message += `\n━━━━━━━━━━\n【新着スケジュール】\n`; for (const e of newEvents) message += formatEvent(e); message += `\n📅 マイカレンダーへの追加お忘れなく！\n` }
message += FOOTER

// 送信対象: y-kudo or yuta129 の line_user_id
const { data: admins } = await s.from('profiles').select('mail, line_user_id').in('mail', ['y-kudo@connectsplus.net', 'yuta129@gmail.com']).not('line_user_id', 'is', null).neq('line_user_id', '')
const targets = admins.filter(a => a.line_user_id)

console.log('==MESSAGE==')
console.log(message)
console.log('==TARGETS==')
for (const t of targets) console.log(`  ${t.mail} → ${t.line_user_id.slice(0, 12)}...`)

for (const t of targets) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: t.line_user_id, messages: [{ type: 'text', text: message }] }),
  })
  console.log(`send to ${t.mail}: ${res.status}`)
}
