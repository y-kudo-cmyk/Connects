// CARAT Ver (+ 17 IS RIGHT HERE DEAR) に各メンバーの BINDER を 13種追加。
// 同時に 17 IS RIGHT HERE DEAR (V_KR021_07) の photocard を 13→52 に拡張。
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

// === 各 CARAT Ver の情報 ===
// id プレフィックスは既存IDの形式に合わせる
const CARAT_VERSIONS = [
  { productId: 'P_KR019', versionId: 'V_KR019_04', idPrefix: 'CM_KR019_04_BINDER_' },  // HEAVEN
  { productId: 'P_KR022', versionId: 'V_KR022_01', idPrefix: 'CM_KR022_01_BINDER_' },  // SPILL THE FEELS
  { productId: 'P_KR018', versionId: 'V_KR018_04', idPrefix: 'CM_KR018_04_BINDER_' },  // FML
  { productId: 'P_KR016', versionId: 'V_KR016_05', idPrefix: 'CM_KR016_05_BINDER_' },  // Face the Sun ep.5 Pioneer
  { productId: 'P_KR021', versionId: 'V_KR021_07', idPrefix: 'CM_KR021_07_BINDER_' },  // 17 IS RIGHT HERE DEAR
]

let totalBinders = 0
for (const v of CARAT_VERSIONS) {
  const rows = MEMBERS.map((memberId, i) => ({
    id: `${v.idPrefix}${String(i + 1).padStart(3, '0')}`,
    product_id: v.productId,
    version_id: v.versionId,
    member_id: memberId,
    member_name: MEMBER_NAMES[memberId],
    card_type: 'binder',
    card_detail: 'Binder',
    front_image_url: '',
    back_image_url: '',
  }))

  const { data: existingIds } = await s.from('card_master').select('id').in('id', rows.map(r => r.id))
  const existingSet = new Set((existingIds || []).map(r => r.id))
  const toInsert = rows.filter(r => !existingSet.has(r.id))
  if (toInsert.length === 0) {
    console.log(`${v.versionId}: already has all binders, skip`)
    continue
  }
  const { error } = await s.from('card_master').insert(toInsert)
  if (error) { console.error(`${v.versionId} ERROR: ${error.message}`); continue }
  console.log(`✓ ${v.versionId}: inserted ${toInsert.length} binders`)
  totalBinders += toInsert.length
}

// === 17 IS RIGHT HERE DEAR: photocard 13→52 ===
const DEAR_VER = 'V_KR021_07'
const { data: existingDear } = await s.from('card_master').select('id, member_id, card_detail').eq('version_id', DEAR_VER).eq('card_type', 'photocard')
console.log(`\n${DEAR_VER} existing photocards: ${existingDear.length}`)
// 既存は 1枚/メンバー. 2枚目以降を追加 (Photocard 2, 3, 4)
const dearRows = []
for (const memberId of MEMBERS) {
  for (let n = 2; n <= 4; n++) {
    dearRows.push({
      id: `CM_KR021_07_PC_${memberId}_${n}`,
      product_id: 'P_KR021',
      version_id: DEAR_VER,
      member_id: memberId,
      member_name: MEMBER_NAMES[memberId],
      card_type: 'photocard',
      card_detail: `Photocard ${n}`,
      front_image_url: '',
      back_image_url: '',
    })
  }
}
const { data: existingDearIds } = await s.from('card_master').select('id').in('id', dearRows.map(r => r.id))
const existingDearSet = new Set((existingDearIds || []).map(r => r.id))
const dearToInsert = dearRows.filter(r => !existingDearSet.has(r.id))
if (dearToInsert.length > 0) {
  const { error } = await s.from('card_master').insert(dearToInsert)
  if (error) console.error(`DEAR photocard ERROR: ${error.message}`)
  else console.log(`✓ DEAR: inserted ${dearToInsert.length} photocards`)
}

// === Verify ===
console.log('\n=== Final state ===')
for (const v of CARAT_VERSIONS) {
  const { count: total } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.versionId)
  const { count: binderCount } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.versionId).eq('card_type', 'binder')
  const { count: photoCount } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.versionId).eq('card_type', 'photocard')
  console.log(`${v.versionId}: total=${total}, binder=${binderCount}, photocard=${photoCount}`)
}

console.log(`\nDone. Binders added: ${totalBinders}, DEAR photocards added: ${dearToInsert.length}`)
