// 特定 version (例: V_KR018_04) の既存 card_master に対して画像を処理・反映
// Usage: node process-album-version.mjs <template-file> <refs-folder>
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const [, , TEMPLATE_NAME, REFS_FOLDER] = process.argv
const TEMPLATE_PATH = `C:\\Users\\D-LINE\\connects-plus\\scripts\\_album_templates\\${TEMPLATE_NAME}.json`
const REFS_DIR = `C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\${REFS_FOLDER}`
const template = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8'))
const { productId: PID, versionId: VID } = template

const memberFiles = readdirSync(REFS_DIR).filter(f => new RegExp(`_A\\d{6}\\.(png|jpg)$`).test(f))
console.log(`${PID} ${VID}: ${memberFiles.length} members to process`)

let processed = 0
for (const file of memberFiles) {
  const mid = file.match(/_(A\d{6})\./)[1]
  const buf = readFileSync(`${REFS_DIR}\\${file}`)
  const meta = await sharp(buf).metadata()
  const sx = meta.width / template.imageSize.width
  const sy = meta.height / template.imageSize.height
  const scale = Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01

  for (const card of template.cards) {
    // Find card_master row: product+version+member+type+detail
    const query = s.from('card_master').select('id, front_image_url').eq('product_id', PID).eq('version_id', VID).eq('member_id', mid).eq('card_type', card.cardType)
    if (card.detail) query.ilike('card_detail', card.detail)
    const { data: rows } = await query
    if (!rows || rows.length === 0) {
      console.log(`  skip ${mid} ${card.cardType} ${card.detail}: no match`)
      continue
    }
    const row = rows[0]
    if (row.front_image_url) continue

    try {
      const left = Math.round(scale ? card.left * sx : card.left)
      const top = Math.round(scale ? card.top * sy : card.top)
      const width = Math.round(scale ? card.width * sx : card.width)
      const height = Math.round(scale ? card.height * sy : card.height)
      const cropped = await sharp(buf).extract({ left, top, width, height }).toBuffer()
      const cm = await sharp(cropped).metadata()
      const whiteLayer = await sharp({ create: { width: cm.width, height: cm.height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.3 } } }).png().toBuffer()
      const finalBuf = await sharp(cropped).composite([{ input: whiteLayer, blend: 'over' }]).webp({ quality: 85 }).toBuffer()

      const path = `masters/${row.id}.webp`
      const { error: upErr } = await s.storage.from('card-images').upload(path, finalBuf, { contentType: 'image/webp', upsert: true })
      if (upErr) { console.error(`  upload ${row.id}: ${upErr.message}`); continue }
      const { data: urlData } = s.storage.from('card-images').getPublicUrl(path)
      await s.from('card_master').update({ front_image_url: urlData.publicUrl + `?v=${Date.now()}` }).eq('id', row.id)
      processed++
    } catch (e) {
      console.error(`  err ${row.id}: ${e.message}`)
    }
  }
  console.log(`  ✓ ${mid}`)
}

const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', VID).not('front_image_url', 'is', null).neq('front_image_url', '')
const { count: total } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', VID)
console.log(`\n${VID}: ${count}/${total} with images (processed ${processed})`)
