import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Gemini detected 1-2 of NEW HEIGHTS and 4-5 of NEW BEGINNING (skip the '3rd slim item')
const TS = { width: 1464, height: 2048 }
const CARDS = [
  { versionId: 'V_KR017_01', detail: 'Photocard 1', left: 114, top: 465, width: 146, height: 238 },
  { versionId: 'V_KR017_01', detail: 'Photocard 2', left: 274, top: 465, width: 146, height: 238 },
  { versionId: 'V_KR017_02', detail: 'Photocard 1', left: 757, top: 465, width: 146, height: 238 },
  { versionId: 'V_KR017_02', detail: 'Photocard 2', left: 918, top: 465, width: 146, height: 238 },
]
const REFS = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\sector17'
const files = readdirSync(REFS).filter(f => /_A\d{6}\.(jpg|png)$/.test(f))
let done = 0
for (const file of files) {
  const mid = file.match(/_(A\d{6})\./)[1]
  const buf = readFileSync(`${REFS}\\${file}`)
  const meta = await sharp(buf).metadata()
  const sx = meta.width / TS.width, sy = meta.height / TS.height
  for (const c of CARDS) {
    const { data: rows } = await s.from('card_master').select('id, front_image_url').eq('version_id', c.versionId).eq('member_id', mid).eq('card_type', 'photocard').ilike('card_detail', c.detail)
    if (!rows?.length) continue
    const row = rows[0]; if (row.front_image_url) continue
    try {
      const cropped = await sharp(buf).extract({ left: Math.round(c.left * sx), top: Math.round(c.top * sy), width: Math.round(c.width * sx), height: Math.round(c.height * sy) }).toBuffer()
      const cm = await sharp(cropped).metadata()
      const w = await sharp({ create: { width: cm.width, height: cm.height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.3 } } }).png().toBuffer()
      const fin = await sharp(cropped).composite([{ input: w, blend: 'over' }]).webp({ quality: 85 }).toBuffer()
      const path = `masters/${row.id}.webp`
      await s.storage.from('card-images').upload(path, fin, { contentType: 'image/webp', upsert: true })
      const { data: u } = s.storage.from('card-images').getPublicUrl(path)
      await s.from('card_master').update({ front_image_url: u.publicUrl + `?v=${Date.now()}` }).eq('id', row.id)
      done++
    } catch (e) { console.error(`${row.id}:`, e.message) }
  }
  console.log(`  ✓ ${mid}`)
}
console.log(`total: ${done}`)
