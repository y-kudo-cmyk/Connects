import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Look at the dupe pairs from source_url grouping
const PAIRS = [
  ['SP00011', 'SP00022'],
  ['SP00062', 'SP00104'],
  ['SP00113', 'SP00048'],
  ['SP00010', 'SP00070'],
  ['SP00110', 'SP00089', 'SP00119', 'SP00122'],
]

for (const group of PAIRS) {
  console.log(`\n== group ${group.join(', ')} ==`)
  for (const id of group) {
    const { data: sp } = await s.from('spots').select('id, spot_name, spot_address, lat, lng, related_artists').eq('id', id).maybeSingle()
    console.log(`  ${id} | ${sp?.spot_name} | ${sp?.spot_address} | ${sp?.lat},${sp?.lng} | ${sp?.related_artists}`)
  }
}

// Also find spots with same lat/lng (positional duplicates)
console.log(`\n\n=== same lat/lng across spots ===`)
const { data: all } = await s.from('spots').select('id, spot_name, spot_address, lat, lng, related_artists')
const byGeo = new Map()
for (const sp of all) {
  if (sp.lat === null || sp.lng === null) continue
  const key = `${sp.lat.toFixed(5)}::${sp.lng.toFixed(5)}`
  if (!byGeo.has(key)) byGeo.set(key, [])
  byGeo.get(key).push(sp)
}
const geoDupes = [...byGeo.entries()].filter(([, arr]) => arr.length > 1)
console.log(`found ${geoDupes.length} position-duplicate groups`)
for (const [key, arr] of geoDupes.slice(0, 20)) {
  console.log(`  ${key} → ${arr.map(x => `${x.id}:${x.spot_name}`).join(' | ')}`)
}
