import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// 1. Duplicate photos within same spot (same spot_id + same image_url)
const { data: all } = await s.from('spot_photos').select('id, spot_id, image_url, source_url, created_at').order('created_at')

const bySpotAndUrl = new Map()
for (const p of all) {
  if (!p.image_url) continue
  const key = `${p.spot_id}::${p.image_url}`
  if (!bySpotAndUrl.has(key)) bySpotAndUrl.set(key, [])
  bySpotAndUrl.get(key).push(p)
}

const sameSpotDupes = [...bySpotAndUrl.entries()].filter(([, arr]) => arr.length > 1)
console.log(`=== same spot + same image_url dupes: ${sameSpotDupes.length} groups ===`)
for (const [key, arr] of sameSpotDupes.slice(0, 10)) {
  console.log(`\n${arr[0].spot_id} has ${arr.length} copies of same photo`)
  for (const p of arr) console.log(`  ${p.id} | created=${p.created_at.slice(0,10)}`)
}

// 2. Duplicate photos across spots (same image_url on different spots)
const byUrl = new Map()
for (const p of all) {
  if (!p.image_url) continue
  if (!byUrl.has(p.image_url)) byUrl.set(p.image_url, [])
  byUrl.get(p.image_url).push(p)
}

const crossSpotDupes = [...byUrl.entries()].filter(([, arr]) => {
  const spotIds = new Set(arr.map(p => p.spot_id))
  return spotIds.size > 1
})
console.log(`\n=== same image_url across different spots: ${crossSpotDupes.length} groups ===`)
for (const [, arr] of crossSpotDupes.slice(0, 10)) {
  const spotIds = [...new Set(arr.map(p => p.spot_id))]
  console.log(`\n  ${arr[0].image_url.slice(0, 70)}... in ${arr.length} photos across spots: ${spotIds.join(', ')}`)
}

// 3. Source URL duplicates across different spots (same source, different spot)
const bySource = new Map()
for (const p of all) {
  if (!p.source_url) continue
  if (!bySource.has(p.source_url)) bySource.set(p.source_url, [])
  bySource.get(p.source_url).push(p)
}
const sourceAcrossSpots = [...bySource.entries()].filter(([, arr]) => {
  const spotIds = new Set(arr.map(p => p.spot_id))
  return spotIds.size > 1
})
console.log(`\n=== same source_url across different spots: ${sourceAcrossSpots.length} groups ===`)
for (const [, arr] of sourceAcrossSpots.slice(0, 5)) {
  const spotIds = [...new Set(arr.map(p => p.spot_id))]
  console.log(`  ${arr[0].source_url.slice(0, 60)}... in spots: ${spotIds.join(', ')}`)
}

console.log(`\ntotal photos: ${all.length}`)
