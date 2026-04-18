import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// 1. Mark ODE TO YOU 10/12 cancelled
const { data: ode1012 } = await s.from('events').select('id')
  .eq('tag', 'LIVE').eq('country', 'JP')
  .ilike('event_title', '%ODE TO YOU%')
  .gte('start_date', '2019-10-12').lte('start_date', '2019-10-12T23:59:59')
if (ode1012?.length) {
  const { error } = await s.from('events').update({ cancelled: true }).eq('id', ode1012[0].id)
  console.log(`ODE TO YOU 10/12 cancelled:`, error ? error.message : 'ok')
}

// 2. Add Shining Diamond 2nd shows
const { data: ref } = await s.from('events').select('image_url, source_url, artist_id')
  .ilike('event_title', '%Shining Diamond%').eq('tag', 'LIVE').eq('country', 'JP').limit(1)
const r = ref?.[0]
console.log('ref:', r)

const shiningNew = [
  { start: '2016-08-05T10:00:00+00:00', spot: '大阪・グランキューブ大阪', sub: '[2nd]' },  // JST 19:00
  { start: '2016-08-09T10:00:00+00:00', spot: '東京・中野サンプラザ', sub: '[2nd]' },     // JST 19:00
]
const rows = shiningNew.map((n) => ({
  tag: 'LIVE',
  artist_id: r?.artist_id || 'A000000',
  event_title: '2016 ‘LIKE SEVENTEEN - Shining Diamond’ in Japan CONCERT',
  sub_event_title: n.sub,
  start_date: n.start,
  end_date: null,
  spot_name: n.spot,
  country: 'JP',
  image_url: r?.image_url || null,
  source_url: r?.source_url || null,
  status: 'confirmed',
  checked: true,
}))
const { data: ins, error: insErr } = await s.from('events').insert(rows).select('id, start_date, spot_name, sub_event_title')
if (insErr) console.error('insert err:', insErr)
else console.log(`\nShining Diamond 2nd inserted: ${ins.length}`)
for (const rr of ins || []) console.log(`  ${rr.start_date.slice(0,10)} | ${rr.spot_name} | ${rr.sub_event_title}`)
