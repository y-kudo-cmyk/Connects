import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'

// pull existing TICKET row for image_url / source_url
const { data: ref } = await s.from('events').select('image_url, source_url').eq('id', '7303d8a1-27fe-4259-9df8-e9bc5bf5fb93').maybeSingle()
const imageUrl = ref?.image_url || null
const sourceUrl = ref?.source_url || 'https://www.hybejapan.events/seventeen/cxm_doubleup'

const shows = [
  { date: '2026-01-31T09:00:00+00:00', spot_name: 'IGアリーナ (愛知)', sub: '[愛知 Day1]' },
  { date: '2026-02-01T09:00:00+00:00', spot_name: 'IGアリーナ (愛知)', sub: '[愛知 Day2]' },
  { date: '2026-02-05T09:00:00+00:00', spot_name: '幕張メッセ国際展示場 展示ホール1-3 (千葉)', sub: '[千葉 Day1]' },
  { date: '2026-02-06T09:00:00+00:00', spot_name: '幕張メッセ国際展示場 展示ホール1-3 (千葉)', sub: '[千葉 Day2]' },
]

const rows = shows.map((s) => ({
  user_id: YUTA,
  event_id: null,
  tag: 'LIVE',
  event_title: 'CxM [DOUBLE UP] LIVE PARTY in JAPAN',
  sub_event_title: s.sub,
  start_date: s.date,
  end_date: null,
  spot_name: s.spot_name,
  spot_address: null,
  image_url: imageUrl,
  source_url: sourceUrl,
  notes: '',
  memo: '',
}))

const { data, error } = await s.from('my_entries').insert(rows).select('id, start_date, spot_name, sub_event_title')
if (error) { console.error(error); process.exit(1) }
console.log(`Inserted: ${data.length}`)
for (const r of data) console.log(`  ${(r.start_date || '').slice(0,10)} | ${r.spot_name} | ${r.sub_event_title}`)
