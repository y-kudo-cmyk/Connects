import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

for (const id of ['SP00073', 'SP00122', 'SP00035', 'SP00323']) {
  const { data: sp } = await s.from('spots').select('spot_name, image_url').eq('id', id).maybeSingle()
  const { data: photos } = await s.from('spot_photos').select('image_url').eq('spot_id', id)
  console.log(`\n== ${id} ${sp?.spot_name} ==`)
  console.log(`spot.image_url:`)
  console.log(`  ${sp?.image_url}`)
  console.log(`photos:`)
  for (const p of photos) console.log(`  ${p.image_url}`)
}
