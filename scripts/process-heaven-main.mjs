import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const REFS = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\heaven_main'
// First check actual image size
const first = readdirSync(REFS)[0]
const meta0 = await sharp(readFileSync(`${REFS}\\${first}`)).metadata()
const TS = { width: meta0.width, height: meta0.height }
console.log('Template size (from first image):', TS)

// AM 5:26 / PM 2:14 / PM 10:23 each has 2 photocards
const CARDS = [
  { versionId: 'V_KR019_01', detail: 'Photocard 1', left: 181, top: 624,  width: 206, height: 336 },
  { versionId: 'V_KR019_01', detail: 'Photocard 2', left: 399, top: 624,  width: 216, height: 336 },
  { versionId: 'V_KR019_02', detail: 'Photocard 1', left: 181, top: 1004, width: 206, height: 336 },
  { versionId: 'V_KR019_02', detail: 'Photocard 2', left: 399, top: 1004, width: 216, height: 336 },
  { versionId: 'V_KR019_03', detail: 'Photocard 1', left: 181, top: 1373, width: 206, height: 370 },
  { versionId: 'V_KR019_03', detail: 'Photocard 2', left: 399, top: 1373, width: 216, height: 370 },
]

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
