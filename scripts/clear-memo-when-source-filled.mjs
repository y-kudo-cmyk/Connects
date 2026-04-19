import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// 1. Spots where spot.source_url is non-empty AND memo is scraped pattern
const isScrapedMemo = (m) => {
  if (!m) return false
  return m.includes('[인스타') || m.includes('[SVT Record') || m.includes('[위버스') || m.toLowerCase().includes('instagram story')
}

const { data: spots } = await s.from('spots').select('id, spot_name, source_url, spot_url, memo')
let cleared = 0
for (const sp of spots) {
  const hasSpotSource = sp.source_url && sp.source_url.trim() && sp.source_url !== 'instagram story'
  const hasSpotHp = sp.spot_url && sp.spot_url.trim()
  if (!hasSpotSource && !hasSpotHp) continue
  if (!isScrapedMemo(sp.memo)) continue
  await s.from('spots').update({ memo: '' }).eq('id', sp.id)
  const reason = hasSpotSource ? 'source_url' : 'spot_url'
  console.log(`  [${reason}] cleared ${sp.id} ${sp.spot_name} ("${sp.memo.slice(0,40)}...")`)
  cleared++
}

// 2. Spots where any spot_photos.source_url is non-empty AND memo is scraped
const { data: photos } = await s.from('spot_photos').select('spot_id, source_url')
const spotsWithPhotoSource = new Set()
for (const p of photos) {
  const has = p.source_url && p.source_url.trim() && p.source_url !== 'instagram story'
  if (has) spotsWithPhotoSource.add(p.spot_id)
}
console.log(`\nspots with a photo-level source: ${spotsWithPhotoSource.size}`)

let cleared2 = 0
for (const sp of spots) {
  if (!spotsWithPhotoSource.has(sp.id)) continue
  // re-fetch memo since may have been cleared in step 1
  const { data: current } = await s.from('spots').select('memo').eq('id', sp.id).maybeSingle()
  if (!isScrapedMemo(current?.memo)) continue
  await s.from('spots').update({ memo: '' }).eq('id', sp.id)
  console.log(`  [photo.source_url] cleared ${sp.id} ${sp.spot_name}`)
  cleared2++
}

console.log(`\ntotal cleared: ${cleared + cleared2}`)
