// V_KR021 に Weverse Album ver. と KiT ver. を追加
// - Weverse Album ver (V_KR021_05): 3 items × 13 members = 39 cards (QR 1 + photocard 2)
// - KiT ver (V_KR021_08): 1 photocard × 13 members = 13 cards
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const MEMBER_NAMES = {
  A000001: 'S.COUPS', A000002: 'JEONGHAN', A000003: 'JOSHUA', A000004: 'JUN',
  A000005: 'HOSHI', A000006: 'WONWOO', A000007: 'WOOZI', A000008: 'THE 8',
  A000009: 'MINGYU', A000010: 'DK', A000011: 'SEUNGKWAN', A000012: 'VERNON', A000013: 'DINO',
}
const MEMBERS = Object.keys(MEMBER_NAMES)

// 1) Add versions
const versions = [
  { version_id: 'V_KR021_05', product_id: 'P_KR021', version_name: 'Weverse Album ver.', tier: 'INCLUDED', sort_order: 5 },
  { version_id: 'V_KR021_08', product_id: 'P_KR021', version_name: 'KiT ver.',           tier: 'INCLUDED', sort_order: 8 },
]
for (const v of versions) {
  const { data: existing } = await s.from('card_versions').select('version_id').eq('version_id', v.version_id).maybeSingle()
  if (existing) { console.log(`${v.version_id}: already exists`); continue }
  const { error } = await s.from('card_versions').insert(v)
  if (error) console.error(`${v.version_id} version err: ${error.message}`)
  else console.log(`✓ version ${v.version_id} ${v.version_name}`)
}

// 2) Add card_master rows
const rows = []
for (const mid of MEMBERS) {
  // Weverse: QR + Photocard 1 + Photocard 2
  rows.push({ id: `CM_KR021_05_QR_${mid}`, product_id: 'P_KR021', version_id: 'V_KR021_05', member_id: mid, member_name: MEMBER_NAMES[mid], card_type: 'qr', card_detail: 'QR Card', front_image_url: '', back_image_url: '' })
  rows.push({ id: `CM_KR021_05_PC_${mid}_1`, product_id: 'P_KR021', version_id: 'V_KR021_05', member_id: mid, member_name: MEMBER_NAMES[mid], card_type: 'photocard', card_detail: 'Photocard 1', front_image_url: '', back_image_url: '' })
  rows.push({ id: `CM_KR021_05_PC_${mid}_2`, product_id: 'P_KR021', version_id: 'V_KR021_05', member_id: mid, member_name: MEMBER_NAMES[mid], card_type: 'photocard', card_detail: 'Photocard 2', front_image_url: '', back_image_url: '' })
  // KiT: 1 photocard
  rows.push({ id: `CM_KR021_08_PC_${mid}_1`, product_id: 'P_KR021', version_id: 'V_KR021_08', member_id: mid, member_name: MEMBER_NAMES[mid], card_type: 'photocard', card_detail: 'Photocard 1', front_image_url: '', back_image_url: '' })
}

const { data: existingIds } = await s.from('card_master').select('id').in('id', rows.map(r => r.id))
const seen = new Set((existingIds || []).map(r => r.id))
const toInsert = rows.filter(r => !seen.has(r.id))
console.log(`${toInsert.length} new card_master rows to insert (${rows.length - toInsert.length} already exist)`)

if (toInsert.length > 0) {
  const { error } = await s.from('card_master').insert(toInsert)
  if (error) console.error('insert err:', error.message)
  else console.log(`✓ inserted ${toInsert.length} rows`)
}

// Verify counts
const { count: w } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', 'V_KR021_05')
const { count: k } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', 'V_KR021_08')
console.log(`\nV_KR021_05 Weverse: ${w} cards`)
console.log(`V_KR021_08 KiT: ${k} cards`)
