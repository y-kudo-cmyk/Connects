import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Geocode via Nominatim (OpenStreetMap)
const addr = '東京都港区麻布十番3-3-10'
const encoded = encodeURIComponent(addr)
const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`, {
  headers: { 'User-Agent': 'connects-plus/1.0' },
})
const results = await res.json()
console.log('geocode result:', results)

let lat = 35.6558  // fallback 麻布十番付近
let lng = 139.7358
if (results?.[0]) {
  lat = parseFloat(results[0].lat)
  lng = parseFloat(results[0].lon)
  console.log(`geocoded: ${lat}, ${lng}`)
} else {
  console.log('geocode failed, using fallback coordinates')
}

const { error } = await s.from('spots').update({
  spot_address: '〒106-0045 東京都港区麻布十番3-3-10',
  lat,
  lng,
}).eq('id', 'SP00122')
if (error) console.error(error)

const { data } = await s.from('spots').select('id, spot_name, spot_address, lat, lng').eq('id', 'SP00122').maybeSingle()
console.log('\nverify:', data)
