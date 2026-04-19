// 汎用コンサート処理: テンプレJSON + ASCII refs folder から product/version/card_master 生成 + クロップ & upload
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const MEMBER_NAMES = {
  A000001: 'S.COUPS', A000002: 'JEONGHAN', A000003: 'JOSHUA', A000004: 'JUN',
  A000005: 'HOSHI', A000006: 'WONWOO', A000007: 'WOOZI', A000008: 'THE 8',
  A000009: 'MINGYU', A000010: 'DK', A000011: 'SEUNGKWAN', A000012: 'VERNON', A000013: 'DINO',
}

// CLI args: productId refsFolder releaseDate
const [, , PRODUCT_ID, REFS_FOLDER, RELEASE_DATE] = process.argv
if (!PRODUCT_ID || !REFS_FOLDER) {
  console.error('Usage: node process-concert-generic.mjs PRODUCT_ID REFS_FOLDER [RELEASE_DATE]')
  process.exit(1)
}

const TEMPLATE_PATH = `C:\\Users\\D-LINE\\connects-plus\\scripts\\_album_templates\\${PRODUCT_ID}.json`
const REFS_DIR = `C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\${REFS_FOLDER}`
const template = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8'))
const PRODUCT_NAME = template.albumName
const VERSION_ID = `V_${PRODUCT_ID.replace(/^P_/, '')}_01`

// 1. Create product
const { data: existingProd } = await s.from('card_products').select('product_id').eq('product_id', PRODUCT_ID).maybeSingle()
if (!existingProd) {
  const { error } = await s.from('card_products').insert({
    product_id: PRODUCT_ID,
    product_name: PRODUCT_NAME,
    product_type: 'concert',
    region: 'EVENT',
    release_date: RELEASE_DATE || '2023-01-01',
    artist_id: 'SEVENTEEN',
    image_url: '',
  })
  if (error) console.error('product err:', error.message)
  else console.log(`✓ product ${PRODUCT_ID}`)
} else console.log(`product ${PRODUCT_ID} already exists`)

// 2. Create version
const { data: existingVer } = await s.from('card_versions').select('version_id').eq('version_id', VERSION_ID).maybeSingle()
if (!existingVer) {
  const { error } = await s.from('card_versions').insert({
    version_id: VERSION_ID,
    product_id: PRODUCT_ID,
    version_name: 'Photocard',
    tier: 'INCLUDED',
    sort_order: 1,
  })
  if (error) console.error('ver err:', error.message)
  else console.log(`✓ version ${VERSION_ID}`)
}

// 3. Create card_master rows (only for members present in refs)
const memberFiles = readdirSync(REFS_DIR).filter(f => new RegExp(`^${PRODUCT_ID}_A\\d{6}\\.(jpg|png)$`).test(f))
console.log(`\nFound ${memberFiles.length} member files`)

const cardCount = template.cards.length
for (const file of memberFiles) {
  const memberId = file.match(/_(A\d{6})\./)[1]
  // Create rows
  const rows = []
  for (let i = 1; i <= cardCount; i++) {
    const masterId = `CM_${PRODUCT_ID.replace(/^P_/, '')}_${memberId}_${i}`
    rows.push({
      id: masterId,
      product_id: PRODUCT_ID,
      version_id: VERSION_ID,
      member_id: memberId,
      member_name: MEMBER_NAMES[memberId] || '',
      card_type: 'photocard',
      card_detail: `Photocard ${i}`,
      front_image_url: '',
      back_image_url: '',
    })
  }
  const { data: existing } = await s.from('card_master').select('id').in('id', rows.map(r => r.id))
  const seen = new Set((existing || []).map(r => r.id))
  const toInsert = rows.filter(r => !seen.has(r.id))
  if (toInsert.length > 0) {
    const { error } = await s.from('card_master').insert(toInsert)
    if (error) console.error(`insert err ${memberId}: ${error.message}`)
    else console.log(`  + ${memberId}: ${toInsert.length} rows`)
  }
}

// 4. Crop + upload + update URL
for (const file of memberFiles) {
  const memberId = file.match(/_(A\d{6})\./)[1]
  const ext = file.endsWith('.png') ? 'png' : 'jpg'
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
  const buf = readFileSync(`${REFS_DIR}\\${file}`)

  // Auto-scale coords if image dimensions differ from template
  const meta = await sharp(buf).metadata()
  const sx = meta.width / template.imageSize.width
  const sy = meta.height / template.imageSize.height
  const needsScale = Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01

  for (let i = 0; i < cardCount; i++) {
    const card = template.cards[i]
    const masterId = `CM_${PRODUCT_ID.replace(/^P_/, '')}_${memberId}_${i + 1}`

    const { data: row } = await s.from('card_master').select('id, front_image_url').eq('id', masterId).maybeSingle()
    if (!row || row.front_image_url) continue

    try {
      const left = Math.round(needsScale ? card.left * sx : card.left)
      const top = Math.round(needsScale ? card.top * sy : card.top)
      const width = Math.round(needsScale ? card.width * sx : card.width)
      const height = Math.round(needsScale ? card.height * sy : card.height)
      const cropped = await sharp(buf).extract({ left, top, width, height }).toBuffer()
      const cm = await sharp(cropped).metadata()
      const whiteLayer = await sharp({ create: { width: cm.width, height: cm.height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.3 } } }).png().toBuffer()
      const finalBuf = await sharp(cropped).composite([{ input: whiteLayer, blend: 'over' }]).webp({ quality: 85 }).toBuffer()

      const { error: upErr } = await s.storage.from('card-images').upload(`masters/${masterId}.webp`, finalBuf, { contentType: 'image/webp', upsert: true })
      if (upErr) { console.error(`upload err ${masterId}: ${upErr.message}`); continue }
      const { data: urlData } = s.storage.from('card-images').getPublicUrl(`masters/${masterId}.webp`)
      const publicUrl = urlData.publicUrl + `?v=${Date.now()}`
      await s.from('card_master').update({ front_image_url: publicUrl }).eq('id', masterId)
    } catch (e) {
      console.error(`err ${masterId}: ${e.message}`)
    }
  }
  console.log(`  ✓ ${memberId} processed`)
}

// Verify
const { count: total } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('product_id', PRODUCT_ID)
const { count: withImg } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('product_id', PRODUCT_ID).not('front_image_url', 'is', null).neq('front_image_url', '')
console.log(`\n${PRODUCT_ID}: ${withImg}/${total} with images`)
