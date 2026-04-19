import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

for (const id of ['SP00279', 'SP00278', 'SP00277']) {
  const { data: sp } = await s.from('spots').select('*').eq('id', id).maybeSingle()
  const { data: ph } = await s.from('spot_photos').select('*').eq('spot_id', id)
  console.log(`\n=== ${id} ${sp?.spot_name} ===`)
  console.log(`memo: "${sp?.memo}"`)
  console.log(`source: "${sp?.source_url}"`)
  console.log(`photos: ${ph.length}`)
  for (const p of ph) console.log(`  contributor="${p.contributor}" submitted_by=${p.submitted_by} source=${p.source_url || '-'}`)
}
