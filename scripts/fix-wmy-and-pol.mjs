import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// ───── 1. WE MAKE YOU: add 2 missing 夜公演 + fix 昼公演 times ─────
// 5/30 昼 OPEN 14:30 / START 15:30 → 15:30 JST = 06:30 UTC
// 5/30 夜 OPEN 18:30 / START 19:30 → 19:30 JST = 10:30 UTC
// 5/31 昼 OPEN 13:30 / START 14:30 → 14:30 JST = 05:30 UTC
// 5/31 夜 OPEN 18:30 / START 19:30 → 19:30 JST = 10:30 UTC

const { data: wmy } = await s.from('events').select('id, start_date, sub_event_title').eq('tag', 'LIVE').eq('country', 'JP').ilike('event_title', '%WE MAKE YOU%').order('start_date')
console.log('existing WE MAKE YOU:')
for (const e of wmy) console.log(`  ${e.id} | ${e.start_date} | ${e.sub_event_title}`)

const { data: wmyRef } = await s.from('events').select('image_url, source_url, artist_id').ilike('event_title', '%WE MAKE YOU%').limit(1)
const wref = wmyRef?.[0] || {}

// Update existing 昼公演 records with correct start times
// 5/30 昼
if (wmy[0]) {
  await s.from('events').update({ start_date: '2018-05-30T06:30:00+00:00' }).eq('id', wmy[0].id)
  console.log('updated 5/30 昼 time')
}
// 5/31 昼
if (wmy[1]) {
  await s.from('events').update({ start_date: '2018-05-31T05:30:00+00:00' }).eq('id', wmy[1].id)
  console.log('updated 5/31 昼 time')
}

// Insert 2 夜公演
const wmyNight = [
  { start: '2018-05-30T10:30:00+00:00', sub: '夜公演' },
  { start: '2018-05-31T10:30:00+00:00', sub: '夜公演' },
]
const wmyRows = wmyNight.map((n) => ({
  tag: 'LIVE',
  artist_id: wref.artist_id || 'A000000',
  event_title: 'SEVENTEEN JAPAN DEBUT SHOWCASE ‘WE MAKE YOU’',
  sub_event_title: n.sub,
  start_date: n.start,
  spot_name: '豊洲PIT',
  country: 'JP',
  image_url: wref.image_url || null,
  source_url: wref.source_url || null,
  status: 'confirmed',
  checked: true,
}))
const { data: wmyInserted, error: wmyErr } = await s.from('events').insert(wmyRows).select('id, start_date, sub_event_title')
if (wmyErr) console.error('wmy err:', wmyErr)
else { console.log(`\nWE MAKE YOU 夜公演 inserted: ${wmyInserted.length}`); for (const r of wmyInserted) console.log(`  ${r.start_date} | ${r.sub_event_title}`) }

// ───── 2. POWER OF LOVE: fix broken venue names ─────
const { data: pol } = await s.from('events').select('id, event_title, start_date, spot_name, sub_event_title').eq('tag', 'LIVE').eq('country', 'JP').ilike('event_title', '%POWER OF LOVE%').order('start_date')
console.log('\nPOWER OF LOVE entries:')
for (const e of pol) console.log(`  ${e.id} | ${e.start_date?.slice(0,10)} | spot="${e.spot_name}" | ${e.event_title}`)

for (const e of pol) {
  await s.from('events').update({ spot_name: 'Online' }).eq('id', e.id)
}
console.log(`\nPOWER OF LOVE ${pol.length}件: spot_name → "Online"`)
