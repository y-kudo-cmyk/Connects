import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TEMPLATE_SIZE = { width: 2048, height: 2048 }
const CARDS = [
  { versionId: 'V_KR015_01', detail: 'photocard 1', left: 166, top: 586, width: 244, height: 365 },
  { versionId: 'V_KR015_01', detail: 'photocard 2', left: 422, top: 586, width: 244, height: 365 },
  { versionId: 'V_KR015_02', detail: 'Photocard 1', left: 166, top: 1075, width: 244, height: 365 },
  { versionId: 'V_KR015_02', detail: 'Photocard 2', left: 422, top: 1075, width: 244, height: 365 },
  { versionId: 'V_KR015_03', detail: 'Photocard 1', left: 168, top: 1544, width: 244, height: 365 },
  { versionId: 'V_KR015_03', detail: 'Photocard 2', left: 426, top: 1544, width: 244, height: 365 },
]

const REFS = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\attacca'
const files = readdirSync(REFS).filter(f => /_A\d{6}\.(png|jpg)$/.test(f))
let done = 0
for (const file of files) {
  const mid = file.match(/_(A\d{6})\./)[1]
  const buf = readFileSync(`${REFS}\\${file}`)
  const meta = await sharp(buf).metadata()
  const sx = meta.width / TEMPLATE_SIZE.width
  const sy = meta.height / TEMPLATE_SIZE.height
  for (const c of CARDS) {
    const { data: rows } = await s.from('card_master').select('id, front_image_url').eq('version_id', c.versionId).eq('member_id', mid).eq('card_type', 'photocard').ilike('card_detail', c.detail)
    if (!rows?.length) continue
    const row = rows[0]
    if (row.front_image_url) continue
    try {
      const left = Math.round(c.left * sx), top = Math.round(c.top * sy)
      const width = Math.round(c.width * sx), height = Math.round(c.height * sy)
      const cropped = await sharp(buf).extract({ left, top, width, height }).toBuffer()
      const cm = await sharp(cropped).metadata()
      const whiteLayer = await sharp({ create: { width: cm.width, height: cm.height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.3 } } }).png().toBuffer()
      const finalBuf = await sharp(cropped).composite([{ input: whiteLayer, blend: 'over' }]).webp({ quality: 85 }).toBuffer()
      const path = `masters/${row.id}.webp`
      await s.storage.from('card-images').upload(path, finalBuf, { contentType: 'image/webp', upsert: true })
      const { data: urlData } = s.storage.from('card-images').getPublicUrl(path)
      await s.from('card_master').update({ front_image_url: urlData.publicUrl + `?v=${Date.now()}` }).eq('id', row.id)
      done++
    } catch (e) { console.error(`  ${row.id}: ${e.message}`) }
  }
  console.log(`  ✓ ${mid}`)
}
console.log(`\ntotal processed: ${done}`)
