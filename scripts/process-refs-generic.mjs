// 汎用: 任意のアルバムの per-member ref composite を、template JSON の座標でクロップして
// 全13メンバーのカード画像を 600-base サイズでSupabase Storageにアップロード。
//
// Usage:
//   node process-refs-generic.mjs <templatePath> <refsFolderName>
// Example:
//   node process-refs-generic.mjs scripts/_album_templates/P_KR023.json KR023
//   refs は scripts/_refs_ascii_KR023/A000001.jpg ~ A000013.jpg を参照
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const BUCKET = 'card-images'

// 600-base サイズ (どのタイプでも幅 or 高さ が 600を基準)
const SIZE_BY_TYPE = {
  photocard:       { w: 600, h: 900 }, // 2:3
  luckydraw:       { w: 600, h: 900 },
  fotocard:        { w: 600, h: 900 },
  minicard:        { w: 600, h: 900 },
  xmas_card:       { w: 600, h: 900 },
  greeting_card:   { w: 600, h: 900 },
  photobook:       { w: 600, h: 600 }, // 1:1
  magnet_sheet:    { w: 600, h: 600 },
  mega_jacket:     { w: 600, h: 600 },
  puzzle:          { w: 600, h: 600 },
  sticker:         { w: 600, h: 600 },
  binder:          { w: 600, h: 750 }, // 4:5
  'tear-off_poster': { w: 600, h: 800 }, // 3:4
  id_card:         { w: 640, h: 400 }, // 8:5
  scratch_card:    { w: 400, h: 800 }, // 1:2 縦長narrow
  fotocard:        { w: 600, h: 600 }, // 1:1 正方形
  postcard:        { w: 900, h: 600 }, // 3:2 横長葉書
  folding_card:    { w: 1000, h: 300 }, // 10:3 横長二つ折り
  layer_card:      { w: 600, h: 600 }, // 1:1
  clear_file:      { w: 500, h: 700 }, // 5:7
  coaster:         { w: 600, h: 600 },
  white:           { w: 600, h: 900 },
  green:           { w: 600, h: 900 },
}

const [, , TEMPLATE_PATH, REFS_SUFFIX] = process.argv
if (!TEMPLATE_PATH || !REFS_SUFFIX) {
  console.error('Usage: node process-refs-generic.mjs <templatePath> <refsSuffix>')
  console.error('Example: node process-refs-generic.mjs scripts/_album_templates/P_KR023.json KR023')
  process.exit(1)
}

const template = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8'))
const PID = template.productId
const REFS_ROOT = `C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii_${REFS_SUFFIX}`

const MEMBER_IDS = [
  'A000001','A000002','A000003','A000004','A000005',
  'A000006','A000007','A000008','A000009','A000010',
  'A000011','A000012','A000013',
]

console.log(`Processing ${PID} from ${TEMPLATE_PATH} using refs in ${REFS_ROOT}...`)

// Group template by versionId, ordered by template array order
const boxesByVersion = new Map()
for (let i = 0; i < template.cards.length; i++) {
  const c = template.cards[i]
  if (!boxesByVersion.has(c.versionId)) boxesByVersion.set(c.versionId, [])
  boxesByVersion.get(c.versionId).push({ ...c, _tplIdx: i })
}

let totalOk = 0, totalExpected = 0
for (const mid of MEMBER_IDS) {
  const srcPath = `${REFS_ROOT}\\${mid}.jpg`
  let buf
  try { buf = readFileSync(srcPath) } catch (e) {
    try { buf = readFileSync(`${REFS_ROOT}\\${mid}.png`) } catch {
      console.log(`  [${mid}] SKIP: no ref file`); continue
    }
  }

  // For this member, fetch all cards per version (ordered by card_detail)
  const memberCardsByVersion = new Map()
  for (const vid of boxesByVersion.keys()) {
    const { data: rows } = await s
      .from('card_master')
      .select('id, card_detail')
      .eq('product_id', PID)
      .eq('version_id', vid)
      .eq('member_id', mid)
      .order('card_detail')
    memberCardsByVersion.set(vid, rows ?? [])
  }

  let ok = 0
  for (const c of template.cards) {
    const boxes = boxesByVersion.get(c.versionId)
    const boxIdx = boxes.findIndex(b => b._tplIdx === c._tplIdx !== undefined ? b._tplIdx === c._tplIdx : false)
    // find position of this box within its version (by _tplIdx)
    const positionInVersion = boxes.findIndex(b => b._tplIdx === template.cards.indexOf(c))
    const memberCards = memberCardsByVersion.get(c.versionId) ?? []
    const row = memberCards[positionInVersion]
    if (!row) {
      console.log(`    skip ${c.versionId} #${positionInVersion}: no card_master row for ${mid} (member has ${memberCards.length} cards)`)
      continue
    }
    const cmId = row.id

    try {
      const size = SIZE_BY_TYPE[c.cardType] || { w: 600, h: 900 }
      const webp = await sharp(buf)
        .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
        .resize(size.w, size.h, { fit: 'fill' })
        .webp({ quality: 88 })
        .toBuffer()

      const path = `masters/${cmId}.webp`
      const { error: upErr } = await s.storage.from(BUCKET)
        .upload(path, webp, { contentType: 'image/webp', upsert: true })
      if (upErr) { console.error(`    upload ${cmId}: ${upErr.message}`); continue }
      const { data: urlData } = s.storage.from(BUCKET).getPublicUrl(path)
      const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`
      await s.from('card_master').update({ front_image_url: publicUrl }).eq('id', cmId)
      ok++
    } catch (e) {
      console.error(`    crop ${c.detail} err:`, e.message)
    }
  }
  console.log(`  [${mid}] ${ok}/${template.cards.length}`)
  totalOk += ok
  totalExpected += template.cards.length
}

console.log(`\nTotal: ${totalOk}/${totalExpected} card images uploaded`)
