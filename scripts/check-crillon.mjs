import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

for (const id of ['SP00286', 'SP00326', 'SP00073', 'SP00123']) {
  const { data: sp } = await s.from('spots').select('*').eq('id', id).maybeSingle()
  const { data: ph } = await s.from('spot_photos').select('image_url, source_url, tags').eq('spot_id', id)
  console.log(`\n== ${id} ==`)
  if (!sp) { console.log('  NOT FOUND'); continue }
  console.log(`  name: ${sp.spot_name}`)
  console.log(`  addr: ${sp.spot_address}`)
  console.log(`  lat/lng: ${sp.lat}, ${sp.lng}`)
  console.log(`  members: ${sp.related_artists}`)
  console.log(`  source: ${sp.source_url || '-'}`)
  console.log(`  memo: ${sp.memo || '-'}`)
  console.log(`  status: ${sp.status}`)
  console.log(`  spot image: ${sp.image_url?.slice(0, 90) || '-'}`)
  for (const p of ph) console.log(`  photo: ${p.image_url?.slice(0, 90) || '-'} src=${p.source_url || '-'}`)
}
