import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// SP00103 (broken found)
const { data: sp103 } = await s.from('spots').select('*').eq('id', 'SP00103').maybeSingle()
console.log('SP00103:', JSON.stringify(sp103, null, 2))
const { data: photos103 } = await s.from('spot_photos').select('*').eq('spot_id', 'SP00103')
console.log('photos:', photos103)

// 芝浦南埠頭公園
console.log('\n=== 芝浦南埠頭公園 ===')
const { data: shibaura } = await s.from('spots').select('*').or('spot_name.ilike.%芝浦%埠頭%,spot_name.ilike.%芝浦南%')
for (const sp of shibaura) {
  console.log(`\n${sp.id} | ${sp.spot_name}`)
  console.log(`  image_url: ${sp.image_url}`)
  // HEAD check + GET check
  try {
    const r1 = await fetch(sp.image_url, { method: 'HEAD' })
    const r2 = await fetch(sp.image_url, { method: 'GET' })
    console.log(`  HEAD: ${r1.status}, GET: ${r2.status} (${r2.headers.get('content-type')})`)
  } catch (e) {
    console.log(`  fetch error: ${e.message}`)
  }
  const { data: ph } = await s.from('spot_photos').select('id, image_url').eq('spot_id', sp.id)
  for (const p of ph) {
    try {
      const r2 = await fetch(p.image_url, { method: 'GET' })
      console.log(`  photo ${p.id.slice(0,8)}: GET ${r2.status} (${r2.headers.get('content-type')})`)
    } catch (e) {
      console.log(`  photo ${p.id.slice(0,8)}: ERR ${e.message}`)
    }
  }
}
