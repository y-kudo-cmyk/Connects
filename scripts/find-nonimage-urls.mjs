import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: photos } = await s.from('spot_photos').select('id, spot_id, image_url').not('image_url', 'is', null).neq('image_url', '')
console.log(`scanning ${photos.length} photos...`)

async function check(url) {
  try {
    const res = await fetch(url, { method: 'GET' })
    const ct = res.headers.get('content-type') || ''
    return { status: res.status, ct }
  } catch (e) {
    return { status: 'error', ct: '', error: e.message }
  }
}

const broken = []
let i = 0
for (const p of photos) {
  i++
  if (i % 50 === 0) console.log(`  ${i}/${photos.length}`)
  const r = await check(p.image_url)
  const isImage = r.ct.startsWith('image/')
  if (r.status !== 200 || !isImage) {
    broken.push({ pid: p.id.slice(0, 8), sid: p.spot_id, status: r.status, ct: r.ct, url: p.image_url })
  }
}
console.log(`\n=== broken or non-image photos: ${broken.length} ===`)
const spotIds = new Set(broken.map(b => b.sid))
for (const b of broken) console.log(`  photo ${b.pid} | spot ${b.sid} | status=${b.status} | ct=${b.ct} | ${b.url.slice(0, 70)}`)

// spot names
if (spotIds.size) {
  const { data: spots } = await s.from('spots').select('id, spot_name').in('id', [...spotIds])
  console.log(`\n=== affected spots: ${spots.length} ===`)
  for (const sp of spots) console.log(`  ${sp.id} | ${sp.spot_name}`)
}
