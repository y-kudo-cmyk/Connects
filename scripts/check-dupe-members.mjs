import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const GROUPS = [
  ['SP00073', 'SP00122'],
  ['SP00286', 'SP00326'],
  ['SP00035', 'SP00323'],
  ['SP00057', 'SP00354'],
  ['SP00394', 'SP00123'],
]

for (const group of GROUPS) {
  console.log(`\n=== ${group.join(' / ')} ===`)
  for (const id of group) {
    const { data: sp } = await s.from('spots').select('spot_name, related_artists, source_url, memo').eq('id', id).maybeSingle()
    const { data: photos } = await s.from('spot_photos').select('tags, source_url, caption').eq('spot_id', id)
    console.log(`  ${id} ${sp?.spot_name}`)
    console.log(`    spot.related_artists: ${sp?.related_artists}`)
    console.log(`    spot.source_url: ${sp?.source_url || '-'}`)
    console.log(`    spot.memo: ${sp?.memo || '-'}`)
    for (const p of photos) {
      console.log(`    photo tags: ${p.tags}`)
      console.log(`    photo source: ${p.source_url || '-'}`)
      console.log(`    photo caption: ${p.caption || '-'}`)
    }
  }
}
