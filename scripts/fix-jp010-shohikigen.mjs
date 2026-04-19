// 消費期限 (P_JP010) DB 修正:
// - JEONGHAN (A000002) を全6バージョンに追加
// - 限定A/B (V_JP010_01/02) にフォトカード2枚目 (フォトカードA/B) 追加
// - card_detail 空欄を埋める (Selfie Photocard A/B/通常、Photocard A/B)
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

// === 1) JEONGHAN を全バージョンに追加 ===
const VERSIONS = [
  { versionId: 'V_JP010_01', selfieLabel: 'Selfie Photocard A' },
  { versionId: 'V_JP010_02', selfieLabel: 'Selfie Photocard B' },
  { versionId: 'V_JP010_03', selfieLabel: 'Selfie Photocard C' },
  { versionId: 'V_JP010_04', selfieLabel: 'Selfie Photocard' },
  { versionId: 'V_JP010_05', selfieLabel: 'Selfie Photocard' },
  { versionId: 'V_JP010_06', selfieLabel: 'Selfie Photocard' },
]

let added = 0
for (const v of VERSIONS) {
  const id = `C_P_JP010_${v.versionId.slice(-2)}_A000002`
  const { data: existing } = await s.from('card_master').select('id').eq('id', id).maybeSingle()
  if (existing) { console.log(`${v.versionId} A000002: already exists`); continue }
  const { error } = await s.from('card_master').insert({
    id,
    product_id: 'P_JP010',
    version_id: v.versionId,
    member_id: 'A000002',
    member_name: 'JEONGHAN',
    card_type: 'photocard',
    card_detail: v.selfieLabel,
    front_image_url: '',
    back_image_url: '',
  })
  if (error) console.error(`  ${v.versionId} JEONGHAN err: ${error.message}`)
  else { console.log(`✓ ${v.versionId}: added JEONGHAN selfie`); added++ }
}

// === 2) 既存 card_master の card_detail を埋める ===
// V_JP010_01 既存 → Selfie Photocard A
// V_JP010_02 既存 → Selfie Photocard B
// V_JP010_03 既存 → Selfie Photocard C
// V_JP010_04 既存 → Selfie Photocard
// V_JP010_05 既存 → Selfie Photocard
// V_JP010_06 既存 → Selfie Photocard
for (const v of VERSIONS) {
  const { error } = await s.from('card_master')
    .update({ card_detail: v.selfieLabel })
    .eq('version_id', v.versionId)
    .is('card_detail', null)
  if (error) console.error(`  update err ${v.versionId}: ${error.message}`)
  else console.log(`✓ ${v.versionId}: backfilled card_detail = ${v.selfieLabel}`)
}

// === 3) 限定A/B に フォトカードA/B (2枚目) を追加 ===
const LIMITED_AB = [
  { versionId: 'V_JP010_01', secondLabel: 'Photocard A' },
  { versionId: 'V_JP010_02', secondLabel: 'Photocard B' },
]
for (const v of LIMITED_AB) {
  for (const memberId of Object.keys(MEMBER_NAMES)) {
    const id = `C_P_JP010_${v.versionId.slice(-2)}_PHOTO_${memberId}`
    const { data: existing } = await s.from('card_master').select('id').eq('id', id).maybeSingle()
    if (existing) continue
    const { error } = await s.from('card_master').insert({
      id,
      product_id: 'P_JP010',
      version_id: v.versionId,
      member_id: memberId,
      member_name: MEMBER_NAMES[memberId],
      card_type: 'photocard',
      card_detail: v.secondLabel,
      front_image_url: '',
      back_image_url: '',
    })
    if (error) console.error(`  ${v.versionId} ${memberId} err: ${error.message}`)
    else added++
  }
  console.log(`✓ ${v.versionId}: added 2nd card (${v.secondLabel}) per member`)
}

// === Verify ===
console.log('\n=== Final counts ===')
for (const v of VERSIONS) {
  const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.versionId)
  console.log(`${v.versionId}: ${count}`)
}
console.log(`\nTotal new rows: ${added}`)
