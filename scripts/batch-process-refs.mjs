// 1アルバム分 (例: 17 IS RIGHT HERE) の全メンバー ALBUM.png をバッチ処理。
// - テンプレートで各トレカを crop
// - 70% opacity で半透明化（白30%合成）
// - Supabase Storage 'card-images' bucket に upload
// - card_master.front_image_url を更新
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import sharp from 'sharp'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// 絵文字 → メンバーID マッピング
const EMOJI_TO_MEMBER = {
  '🍒': 'A000001', '👼': 'A000002', '🐰': 'A000003', '🐱': 'A000004',
  '🐯': 'A000005', '🦊': 'A000006', '🍚': 'A000007', '🐸': 'A000008',
  '🐶': 'A000009', '🍕': 'A000010', '🍊': 'A000011', '🐻‍❄️': 'A000012',
  '🦖': 'A000013',
}

// ASCII 版ソースを使うため、既にリネームされたフォルダを想定。
// もし絵文字フォルダしかない場合は、読み込み時に変換する。
const REFS_ROOT = 'C:\\Users\\D-LINE\\Downloads\\trading-cards-ref\\トレカ一覧\\Album'
const ASCII_CACHE = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii'

const TEMPLATE_PATH = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_album_templates\\P_KR021.json'
const template = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8'))
const PRODUCT_ID = template.productId

// Version ID mapping for 17 IS RIGHT HERE
const VERSION_MAP = {
  'HERE': 'V_KR021_01',
  'HEAR': 'V_KR021_02',
  'DEAR': 'V_KR021_07',
  'WEVERSE': 'V_KR021_05',
  'KIT': 'V_KR021_08',
}

const ENABLED_VERSIONS = new Set(['HERE', 'HEAR', 'DEAR', 'WEVERSE', 'KIT'])

// Read ascii cache folder for copied images
const memberFiles = readdirSync(ASCII_CACHE).filter(f => f.startsWith('P_KR021_') && f.endsWith('.png') && !f.includes('_grid') && !f.includes('_preview'))
console.log(`Found ${memberFiles.length} member images in ASCII cache`)

for (const file of memberFiles) {
  const match = file.match(/^P_KR021_(A\d+)\.png$/)
  if (!match) continue
  const memberId = match[1]
  console.log(`\n== ${memberId} ==`)

  const imgBuf = readFileSync(`${ASCII_CACHE}\\${file}`)

  for (const card of template.cards) {
    if (!ENABLED_VERSIONS.has(card.version)) continue
    const versionId = VERSION_MAP[card.version]

    // Find matching card_master row
    const query = s.from('card_master')
      .select('id, front_image_url')
      .eq('product_id', PRODUCT_ID)
      .eq('version_id', versionId)
      .eq('member_id', memberId)
      .eq('card_type', card.cardType)
    if (card.cardType === 'photocard') query.eq('card_detail', card.detail)
    const { data: rows } = await query
    if (!rows || rows.length === 0) {
      console.log(`  skip ${card.version} ${card.cardType} ${card.detail}: no card_master match`)
      continue
    }
    const row = rows[0]
    if (row.front_image_url) {
      console.log(`  ${row.id}: already has front_image_url, skip`)
      continue
    }

    try {
      // Crop + semi-transparent (70% opacity via white 30% overlay)
      const cropped = await sharp(imgBuf)
        .extract({ left: card.left, top: card.top, width: card.width, height: card.height })
        .toBuffer()
      const { width: cw, height: ch } = await sharp(cropped).metadata()
      const whiteLayer = await sharp({
        create: { width: cw, height: ch, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.3 } },
      }).png().toBuffer()
      const finalBuf = await sharp(cropped)
        .composite([{ input: whiteLayer, blend: 'over' }])
        .webp({ quality: 85 })
        .toBuffer()

      // Upload to Storage
      const storagePath = `masters/${row.id}.webp`
      const { error: upErr } = await s.storage
        .from('card-images')
        .upload(storagePath, finalBuf, { contentType: 'image/webp', upsert: true })
      if (upErr) { console.error(`  upload err ${row.id}: ${upErr.message}`); continue }

      const { data: urlData } = s.storage.from('card-images').getPublicUrl(storagePath)
      const publicUrl = urlData.publicUrl

      // Update card_master
      const { error: updErr } = await s.from('card_master')
        .update({ front_image_url: publicUrl })
        .eq('id', row.id)
      if (updErr) { console.error(`  db err ${row.id}: ${updErr.message}`); continue }

      console.log(`  ✓ ${row.id} ${card.version} ${card.detail} → ${storagePath}`)
    } catch (e) {
      console.error(`  err ${card.version} ${card.detail}: ${e.message}`)
    }
  }
}

console.log('\nDone.')
