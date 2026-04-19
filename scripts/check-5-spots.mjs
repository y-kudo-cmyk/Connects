import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const names = ['さぬき家', '루미에르', 'winks', 'パークハイアット', '御津']
for (const n of names) {
  const { data } = await s.from('spots').select('id, spot_name, spot_address, submitted_by, source_url, created_at, memo').ilike('spot_name', `%${n}%`)
  console.log(`\n== ${n} ==`)
  for (const sp of data || []) {
    const { data: ph } = await s.from('spot_photos').select('contributor, source_url, submitted_by').eq('spot_id', sp.id)
    console.log(`  spot=${sp.id} | ${sp.spot_name}`)
    console.log(`    addr=${sp.spot_address}`)
    console.log(`    submitted_by=${sp.submitted_by}`)
    console.log(`    source_url=${sp.source_url || '-'}`)
    console.log(`    photos:`, ph)
  }
}
