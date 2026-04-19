import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const IMAGE = 'https://cjhwxocabmmrsmdfyqzr.supabase.co/storage/v1/object/public/event-images/tour-posters/double-up.webp'
const SOURCE = 'https://www.hybejapan.events/seventeen/cxm_doubleup'

// 1. Delete the mis-tagged "受取予約" LIVE row
const { error: delErr, count: delCount } = await s.from('events').delete({ count: 'exact' }).eq('id', '912d1e3d-bddc-4115-87dc-a9960dab88da')
if (delErr) { console.error('delete err:', delErr); process.exit(1) }
console.log(`Deleted mis-tagged LIVE row: ${delCount}`)

// Also delete this from anyone's my_entries (just in case others had it registered)
const { error: meErr, count: meCount } = await s.from('my_entries').delete({ count: 'exact' }).eq('event_id', '912d1e3d-bddc-4115-87dc-a9960dab88da')
if (meErr) console.error('my_entries delete err:', meErr)
else console.log(`Deleted my_entries referencing it: ${meCount}`)

// 2. Insert 4 proper LIVE rows
const shows = [
  { start: '2026-01-31T09:00:00+00:00', end: '2026-01-31T11:00:00+00:00', spot: 'IGアリーナ (愛知)', sub: '[愛知 Day1]' },
  { start: '2026-02-01T09:00:00+00:00', end: '2026-02-01T11:00:00+00:00', spot: 'IGアリーナ (愛知)', sub: '[愛知 Day2]' },
  { start: '2026-02-05T09:00:00+00:00', end: '2026-02-05T11:00:00+00:00', spot: '幕張メッセ国際展示場 展示ホール1-3 (千葉)', sub: '[千葉 Day1]' },
  { start: '2026-02-06T09:00:00+00:00', end: '2026-02-06T11:00:00+00:00', spot: '幕張メッセ国際展示場 展示ホール1-3 (千葉)', sub: '[千葉 Day2]' },
]

const rows = shows.map((sh) => ({
  tag: 'LIVE',
  artist_id: 'A000000',
  event_title: 'CxM [DOUBLE UP] LIVE PARTY in JAPAN',
  sub_event_title: sh.sub,
  start_date: sh.start,
  end_date: sh.end,
  spot_name: sh.spot,
  country: 'JP',
  image_url: IMAGE,
  source_url: SOURCE,
  status: 'confirmed',
  checked: true,
}))

const { data, error } = await s.from('events').insert(rows).select('id, start_date, spot_name, sub_event_title')
if (error) { console.error('insert err:', error); process.exit(1) }
console.log(`\nInserted LIVE events: ${data.length}`)
for (const r of data) console.log(`  ${(r.start_date || '').slice(0,10)} | ${r.spot_name} | ${r.sub_event_title} (id=${r.id})`)

// 3. Update YUTA's my_entries to link to the new event_ids
const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
const { data: yutaEntries } = await s.from('my_entries').select('id, start_date, spot_name').eq('user_id', YUTA).eq('tag', 'LIVE').ilike('event_title', 'CxM%DOUBLE UP%JAPAN%')
console.log(`\nYUTA CxM entries: ${yutaEntries.length}`)
for (const y of yutaEntries) {
  const match = data.find(ev => ev.start_date.slice(0,10) === (y.start_date || '').slice(0,10))
  if (match) {
    await s.from('my_entries').update({ event_id: match.id }).eq('id', y.id)
    console.log(`  linked ${(y.start_date || '').slice(0,10)} → event ${match.id}`)
  }
}
