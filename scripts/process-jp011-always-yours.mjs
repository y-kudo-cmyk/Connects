// Process ALWAYS YOURS (P_JP011) trading card references.
// Source: C:/tmp/jp011-extract/ALWAYS YOURS/A000001.png ... A000013.png (each 2481x3818)
// Crops 21 slots per member, maps each slot to a (version_id, card_detail) → card_master row.
// Uploads cropped WebP to `card-images/masters/{card_master.id}.webp` and sets front_image_url.
//
// Slot 5 (MCARD) is special — only the 3 unit leaders have rows, so non-leaders skip it.
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
const SRC_DIR = 'C:/tmp/jp011-extract/ALWAYS YOURS'

// The zip uses emoji filenames. Bash pre-copied them to A0000xx.png (ASCII) because Node on
// Windows cannot open some of these emoji paths (surrogate / combining sequences fail via
// fs.openSync). Kept the emoji map only for reference.
const MEMBER_TO_EMOJI = {
  'A000001': '🍒',     'A000002': '👼🏻',    'A000003': '🐰',
  'A000004': '🐱',     'A000005': '🐯',      'A000006': '🦊',
  'A000007': '🍚',     'A000008': '🐸',      'A000009': '🐶',
  'A000010': '🍕',     'A000011': '🍊',      'A000012': '🐻‍❄️',
  'A000013': '🦖',
}

const MEMBER_NAMES = {
  'A000001': 'S.COUPS',    'A000002': 'JEONGHAN', 'A000003': 'JOSHUA',
  'A000004': 'JUN',         'A000005': 'HOSHI',    'A000006': 'WONWOO',
  'A000007': 'WOOZI',       'A000008': 'THE 8',    'A000009': 'MINGYU',
  'A000010': 'DK',          'A000011': 'SEUNGKWAN','A000012': 'VERNON',
  'A000013': 'DINO',
}

// 21 slot boxes in the 2481x3818 reference (layout shared across all 13 PNGs).
const SLOTS = [
  { slot:1,  left:365,  top:708,  width:313, height:496 },
  { slot:2,  left:716,  top:700,  width:324, height:508 },
  { slot:3,  left:1080, top:700,  width:311, height:496 },
  { slot:4,  left:1441, top:704,  width:317, height:496 },
  { slot:5,  left:1804, top:715,  width:312, height:493 },
  { slot:6,  left:554,  top:1300, width:322, height:514 },
  { slot:7,  left:907,  top:1295, width:324, height:508 },
  { slot:8,  left:1271, top:1319, width:315, height:488 },
  { slot:9,  left:1620, top:1307, width:321, height:481 },
  { slot:10, left:200,  top:2101, width:271, height:435 },
  { slot:11, left:499,  top:2107, width:278, height:429 },
  { slot:12, left:822,  top:2119, width:268, height:413 },
  { slot:13, left:1124, top:2114, width:267, height:422 },
  { slot:14, left:1432, top:2112, width:267, height:422 },
  { slot:15, left:1723, top:2124, width:267, height:422 },
  { slot:16, left:2012, top:2122, width:267, height:422 },
  { slot:17, left:365,  top:2833, width:306, height:496 },
  { slot:18, left:732,  top:2846, width:306, height:496 },
  { slot:19, left:1092, top:2850, width:306, height:496 },
  { slot:20, left:1441, top:2837, width:306, height:496 },
  { slot:21, left:1817, top:2831, width:306, height:496 },
]

// slot → version_id. Slot 5 (MCARD) is handled separately — leaders only.
const SLOT_VERSION_MAP = {
  1:  'V_JP011_01',
  2:  'V_JP011_02',
  3:  'V_JP011_03',
  4:  'V_JP011_04',  // photocard (card_detail is null for this row)
  // 5:  MCARD — handled below, not via SLOT_VERSION_MAP
  6:  'V_JP011_05',
  7:  'V_JP011_06',
  8:  'V_JP011_07',
  9:  'V_JP011_08',
  10: 'V_JP011_BEN_WEVERSE_GB',
  11: 'V_JP011_BEN_WEVERSE_JP',
  12: 'V_JP011_BEN_UMS',
  13: 'V_JP011_BEN_HMV',
  14: 'V_JP011_BEN_TOWER',
  15: 'V_JP011_BEN_TSUTAYA',
  16: 'V_JP011_BEN_7NET',
  17: 'V_JP011_LUCKY_WEVERSE_JP',
  18: 'V_JP011_LUCKY_UMS',
  19: 'V_JP011_LUCKY_HMV',
  20: 'V_JP011_LUCKY_TOWER',
  21: 'V_JP011_LUCKY_TSUTAYA',
}

// MCARD leaders → card_master.id
const MCARD_BY_LEADER = {
  'A000001': 'CM_P_JP011_MCARD_HIPHOP',
  'A000005': 'CM_P_JP011_MCARD_PERFORMANCE',
  'A000007': 'CM_P_JP011_MCARD_VOCAL',
}

// Output sizes — all 21 slots are 2:3 photocards per the spec.
const OUT_W = 467, OUT_H = 757

async function findCardMasterId(versionId, memberId) {
  // For V_JP011_04 the photocard row has card_detail = null (MCARD rows share the same
  // version_id but have non-null detail). Match by member_id alone and require null detail
  // when we're looking at V_JP011_04 to avoid hitting the 3 MCARD rows.
  let q = s.from('card_master').select('id')
    .eq('product_id', 'P_JP011')
    .eq('version_id', versionId)
    .eq('member_id', memberId)
  if (versionId === 'V_JP011_04') q = q.is('card_detail', null)
  const { data, error } = await q
  if (error) throw error
  if (!data || data.length === 0) return null
  if (data.length > 1) console.warn(`    multiple matches for ${versionId}/${memberId}: ${data.map(r=>r.id).join(', ')}`)
  return data[0].id
}

async function uploadAndUpdate(cmId, buffer) {
  const path = `masters/${cmId}.webp`
  const { error: upErr } = await s.storage.from(BUCKET)
    .upload(path, buffer, { contentType: 'image/webp', upsert: true })
  if (upErr) throw new Error(`upload: ${upErr.message}`)
  const { data: urlData } = s.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`
  const { error: updErr } = await s.from('card_master')
    .update({ front_image_url: publicUrl })
    .eq('id', cmId)
  if (updErr) throw new Error(`update: ${updErr.message}`)
}

async function processMember(memberId) {
  const srcPath = `${SRC_DIR}/${memberId}.png`
  let buf
  try { buf = readFileSync(srcPath) } catch (e) {
    return { memberId, ok: 0, attempted: 0, errors: [`no source file: ${e.code}`] }
  }
  const img = sharp(buf, { unlimited: true })

  let ok = 0, attempted = 0
  const errors = []

  for (const box of SLOTS) {
    let cmId = null
    if (box.slot === 5) {
      cmId = MCARD_BY_LEADER[memberId]
      if (!cmId) continue  // non-leader → skip MCARD slot
    } else {
      const versionId = SLOT_VERSION_MAP[box.slot]
      if (!versionId) continue
      try {
        cmId = await findCardMasterId(versionId, memberId)
      } catch (e) {
        errors.push(`slot${box.slot} lookup: ${e.message}`)
        continue
      }
      if (!cmId) {
        errors.push(`slot${box.slot} ${versionId}: no card_master row for ${memberId}`)
        continue
      }
    }

    attempted++
    try {
      const cropped = await img
        .clone()
        .extract({ left: box.left, top: box.top, width: box.width, height: box.height })
        .resize(OUT_W, OUT_H, { fit: 'fill' })
        .webp({ quality: 88 })
        .toBuffer()

      await uploadAndUpdate(cmId, cropped)
      ok++
    } catch (e) {
      errors.push(`slot${box.slot} ${cmId}: ${e.message}`)
    }
  }

  return { memberId, ok, attempted, errors }
}

console.log('Processing 13 members for P_JP011 ALWAYS YOURS...')
const results = []
let totalOk = 0, totalAttempted = 0
const allErrors = []

for (const mid of Object.keys(MEMBER_TO_EMOJI)) {
  const r = await processMember(mid)
  results.push(r)
  totalOk += r.ok
  totalAttempted += r.attempted
  for (const e of r.errors) allErrors.push(`[${mid} ${MEMBER_NAMES[mid]}] ${e}`)
  console.log(`  [${mid} ${MEMBER_NAMES[mid]}] ${r.ok}/${r.attempted}${r.errors.length ? ` (errs: ${r.errors.length})` : ''}`)
}

console.log(`\n=== Summary ===`)
console.log(`Members processed: ${results.length}`)
console.log(`Uploads OK: ${totalOk}/${totalAttempted}`)
if (allErrors.length) {
  console.log(`\nErrors (${allErrors.length}):`)
  for (const e of allErrors) console.log(`  - ${e}`)
}

// Verification SELECT
console.log(`\n=== Verification ===`)
const { data: ver, error: verErr } = await s
  .from('card_master')
  .select('version_id, front_image_url')
  .eq('product_id', 'P_JP011')
if (verErr) {
  console.error('verification select err:', verErr.message)
} else {
  const byVer = {}
  for (const r of ver) {
    if (!byVer[r.version_id]) byVer[r.version_id] = { rows: 0, with_img: 0 }
    byVer[r.version_id].rows++
    if (r.front_image_url) byVer[r.version_id].with_img++
  }
  const keys = Object.keys(byVer).sort()
  for (const k of keys) {
    const o = byVer[k]
    console.log(`  ${k}: rows=${o.rows}, with_img=${o.with_img}${o.rows !== o.with_img ? ' *** INCOMPLETE ***' : ''}`)
  }
  console.log(`  TOTAL: rows=${ver.length}, with_img=${ver.filter(r=>r.front_image_url).length}`)
}
