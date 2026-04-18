import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: spots } = await s.from('spots').select('*').ilike('spot_name', '%대봉집%')
console.log(`spots: ${spots.length}`)
for (const sp of spots) {
  console.log(`\n== ${sp.id} ${sp.spot_name} ==`)
  console.log('  related_artists:', sp.related_artists)
  console.log('  memo:', sp.memo)
  console.log('  source:', sp.source_url)
  const { data: photos } = await s.from('spot_photos').select('*').eq('spot_id', sp.id).order('created_at', { ascending: false })
  console.log(`  photos: ${photos.length}`)
  for (const p of photos) {
    console.log(`    ${p.id.slice(0,8)} | tags="${p.tags}" | src=${p.source_url || '-'} | created=${p.created_at?.slice(0,19)}`)
  }
}
