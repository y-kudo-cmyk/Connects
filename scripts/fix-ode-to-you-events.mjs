import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// 1. Mark 10/12 as cancelled
const { data: cancelled, error: e1 } = await s.from('events').update({ status: 'cancelled' }).eq('tag', 'LIVE').eq('country', 'JP').eq('start_date', '2019-10-12T00:00:00+00:00').ilike('event_title', '%ODE TO YOU%').select('id, start_date')
if (e1) console.error('cancel err:', e1)
else console.log('cancelled:', cancelled)

// retry with broader date match
const { data: c2 } = await s.from('events').update({ status: 'cancelled' }).eq('tag', 'LIVE').eq('country', 'JP').gte('start_date', '2019-10-12').lte('start_date', '2019-10-12T23:59:59').ilike('event_title', '%ODE TO YOU%').select('id, start_date')
console.log('cancelled v2:', c2)

// 2. Get reference row for image/source
const { data: ref } = await s.from('events').select('image_url, source_url, artist_id').eq('tag', 'LIVE').eq('country', 'JP').eq('start_date', '2019-10-08T00:00:00+00:00').maybeSingle()
// fallback
const refAny = ref || (await s.from('events').select('image_url, source_url, artist_id').ilike('event_title', '%ODE TO YOU%').eq('country', 'JP').limit(1)).data?.[0]
console.log('ref:', refAny)

// 3. Add 4 missing LIVE/JP events
const newRows = [
  { start: '2019-10-13T08:00:00+00:00', end: '2019-10-13T10:00:00+00:00', spot: 'Aichi Sky Expo(愛知県国際展示場)ホールA', title: 'SEVENTEEN WORLD TOUR <ODE TO YOU> IN JAPAN Aichi Sky Expo(愛知県国際展示場)ホールA' },
  { start: '2019-10-14T07:00:00+00:00', end: '2019-10-14T09:00:00+00:00', spot: 'Aichi Sky Expo(愛知県国際展示場)ホールA', title: 'SEVENTEEN WORLD TOUR <ODE TO YOU> IN JAPAN Aichi Sky Expo(愛知県国際展示場)ホールA' },
  { start: '2019-11-08T09:30:00+00:00', end: '2019-11-08T11:30:00+00:00', spot: '幕張メッセ国際展示場4-6ホール', title: 'SEVENTEEN WORLD TOUR <ODE TO YOU> IN JAPAN 幕張メッセ国際展示場4-6ホール' },
  { start: '2019-11-09T06:00:00+00:00', end: '2019-11-09T08:00:00+00:00', spot: '幕張メッセ国際展示場4-6ホール', title: 'SEVENTEEN WORLD TOUR <ODE TO YOU> IN JAPAN 幕張メッセ国際展示場4-6ホール' },
]

const rows = newRows.map((r) => ({
  tag: 'LIVE',
  artist_id: refAny?.artist_id || 'A000000',
  event_title: r.title,
  start_date: r.start,
  end_date: r.end,
  spot_name: r.spot,
  country: 'JP',
  image_url: refAny?.image_url || null,
  source_url: refAny?.source_url || null,
  status: 'confirmed',
  checked: true,
}))

const { data: inserted, error: e2 } = await s.from('events').insert(rows).select('id, start_date, spot_name')
if (e2) { console.error('insert err:', e2); process.exit(1) }
console.log(`\ninserted: ${inserted.length}`)
for (const r of inserted) console.log(`  ${r.start_date.slice(0,10)} | ${r.spot_name}`)
