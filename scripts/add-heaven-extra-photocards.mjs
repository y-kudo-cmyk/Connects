// SEVENTEENTH HEAVEN (P_KR019) 封入 3バージョン:
// AM 5:26 / PM 2:14 / PM 10:23 の各メンバーを 2枚 → 4枚 に拡張
// 既存ID: CM_KR019_XX_001..026 (member×2). 新規: _027..052 (member×2)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PRODUCT_ID = 'P_KR019'
const VERSIONS = ['V_KR019_01', 'V_KR019_02', 'V_KR019_03']
const MEMBER_NAMES = {
  A000001: 'S.COUPS', A000002: 'JEONGHAN', A000003: 'JOSHUA', A000004: 'JUN',
  A000005: 'HOSHI', A000006: 'WONWOO', A000007: 'WOOZI', A000008: 'THE 8',
  A000009: 'MINGYU', A000010: 'DK', A000011: 'SEUNGKWAN', A000012: 'VERNON', A000013: 'DINO',
}
const MEMBERS = Object.keys(MEMBER_NAMES)

let totalAdded = 0
for (const versionId of VERSIONS) {
  const vNum = versionId.slice(-2)  // '01' | '02' | '03'
  const { data: existing } = await s.from('card_master').select('id').eq('version_id', versionId).order('id', { ascending: false }).limit(1)
  const lastNum = existing?.[0]?.id ? parseInt(existing[0].id.slice(-3)) : 0
  console.log(`\n== ${versionId}: last existing id = ${lastNum} ==`)

  const rows = []
  let seq = lastNum
  for (const memberId of MEMBERS) {
    for (let n = 3; n <= 4; n++) {
      seq++
      rows.push({
        id: `CM_KR019_${vNum}_${String(seq).padStart(3, '0')}`,
        product_id: PRODUCT_ID,
        version_id: versionId,
        member_id: memberId,
        member_name: MEMBER_NAMES[memberId],
        card_type: 'photocard',
        card_detail: `Photocard ${n}`,
        front_image_url: '',
        back_image_url: '',
      })
    }
  }
  // Skip any that already exist
  const { data: existingIds } = await s.from('card_master').select('id').eq('version_id', versionId).in('id', rows.map(r => r.id))
  const existingSet = new Set((existingIds || []).map(r => r.id))
  const toInsert = rows.filter(r => !existingSet.has(r.id))
  console.log(`  rows to insert: ${toInsert.length} (skipped ${rows.length - toInsert.length} existing)`)
  if (toInsert.length === 0) continue
  const { error } = await s.from('card_master').insert(toInsert)
  if (error) { console.error(`  ERROR: ${error.message}`); continue }
  console.log(`  ✓ inserted ${toInsert.length} rows`)
  totalAdded += toInsert.length
}

console.log(`\nDone. Total added: ${totalAdded}`)

// Verify final counts
for (const v of VERSIONS) {
  const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v)
  console.log(`  ${v}: ${count} cards`)
}
