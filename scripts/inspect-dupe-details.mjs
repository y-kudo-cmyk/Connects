import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const IDS = ['SP00286', 'SP00326', 'SP00323', 'SP00035', 'SP00394', 'SP00123', 'SP00057', 'SP00354', 'SP00073', 'SP00122']
const { data } = await s.from('spots').select('*').in('id', IDS)
for (const sp of data) {
  console.log(`\n${sp.id} | ${sp.spot_name}`)
  console.log(`  addr: "${sp.spot_address}"`)
  console.log(`  lat/lng: ${sp.lat} / ${sp.lng}`)
  console.log(`  source: ${sp.source_url || '-'}`)
}

// Run a STRICT dupe check: same spot_name (normalized) + close lat/lng
console.log(`\n\n=== strict dupe check (same normalized name AND same lat/lng) ===`)
const { data: all } = await s.from('spots').select('id, spot_name, spot_address, lat, lng')
const norm = (s) => (s || '').toLowerCase().replace(/[\s\u3000・\-()]/g, '').normalize('NFKC')
const byNameGeo = new Map()
for (const sp of all) {
  if (sp.lat === null) continue
  const key = `${norm(sp.spot_name)}::${sp.lat.toFixed(4)}::${sp.lng.toFixed(4)}`
  if (!byNameGeo.has(key)) byNameGeo.set(key, [])
  byNameGeo.get(key).push(sp)
}
const strictDupes = [...byNameGeo.entries()].filter(([, arr]) => arr.length > 1)
console.log(`strict: ${strictDupes.length} groups`)
for (const [, arr] of strictDupes) {
  console.log(`\n  ${arr.map(x => `${x.id}: ${x.spot_name}`).join(' | ')}`)
  for (const x of arr) console.log(`    addr=${x.spot_address} | geo=${x.lat},${x.lng}`)
}
