import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: spots } = await s.from('spots').select('id, spot_name, image_url').not('image_url', 'is', null).neq('image_url', '')
console.log(`spots with image_url: ${spots.length}`)

const { data: photos } = await s.from('spot_photos').select('id, spot_id, image_url').not('image_url', 'is', null).neq('image_url', '')
console.log(`spot_photos with image_url: ${photos.length}\n`)

async function check(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return { ok: res.ok, status: res.status }
  } catch (e) {
    return { ok: false, status: 'error', error: e.message }
  }
}

// Check spots
const brokenSpots = []
let i = 0
for (const sp of spots) {
  i++
  if (i % 50 === 0) console.log(`  ...${i}/${spots.length}`)
  const r = await check(sp.image_url)
  if (!r.ok) brokenSpots.push({ id: sp.id, name: sp.spot_name, url: sp.image_url, status: r.status })
}
console.log(`\n=== broken spot.image_url: ${brokenSpots.length} ===`)
for (const b of brokenSpots) console.log(`  ${b.id} | ${b.name} | ${b.status} | ${b.url.slice(0, 80)}`)

// Check photos
const brokenPhotos = []
i = 0
for (const p of photos) {
  i++
  if (i % 50 === 0) console.log(`  ...${i}/${photos.length}`)
  const r = await check(p.image_url)
  if (!r.ok) brokenPhotos.push({ id: p.id.slice(0, 8), spot: p.spot_id, url: p.image_url, status: r.status })
}
console.log(`\n=== broken spot_photos.image_url: ${brokenPhotos.length} ===`)
for (const b of brokenPhotos.slice(0, 100)) console.log(`  photo ${b.id} | spot ${b.spot} | ${b.status} | ${b.url.slice(0, 80)}`)
if (brokenPhotos.length > 100) console.log(`  ... +${brokenPhotos.length - 100} more`)

// Merged view: spots that have no working image
const brokenSpotIds = new Set(brokenSpots.map(b => b.id))
const brokenPhotoSpotIds = new Set(brokenPhotos.map(b => b.spot))
const affectedSpots = new Set([...brokenSpotIds, ...brokenPhotoSpotIds])
console.log(`\n=== spots with at least one broken image: ${affectedSpots.size} ===`)
