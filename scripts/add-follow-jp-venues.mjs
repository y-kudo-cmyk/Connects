// P_CON_FOLLOW_JP: 5 会場別特典トレカバージョン + card_master 65行を追加
// ---------------------------------------------------------------
// ZIP 『ALWAYS YOURS-20260423T000734Z-3-001』の FOLLOW Benefit/ サブフォルダに
// AICHI / FUKUOKA / OSAKA / SAITAMA / TOKYO (2481x3170) の 5会場特典トレカ画像が入っていた。
// これは FOLLOW ツアー会場で CD を購入したファンに配布された特典のため、
// P_JP011 ALWAYS YOURS ではなく P_CON_FOLLOW_JP 側に紐付ける。
//
// DB 現状: V_CON_FOLLOW_JP_01 (tier=VENUE, sort_order=1) が既にあり、汎用の
// 13×8 = 104 行 (Photocard 1..8) が登録済み。これらは維持し、会場別を追加。
//
// 画像座標は未取得。front_image_url は空のまま。後日 process-xxx-refs.mjs で処理。
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PRODUCT_ID = 'P_CON_FOLLOW_JP'

const MEMBER_NAMES = {
  A000001: 'S.COUPS', A000002: 'JEONGHAN', A000003: 'JOSHUA', A000004: 'JUN',
  A000005: 'HOSHI', A000006: 'WONWOO', A000007: 'WOOZI', A000008: 'THE 8',
  A000009: 'MINGYU', A000010: 'DK', A000011: 'SEUNGKWAN', A000012: 'VERNON', A000013: 'DINO',
}
const MEMBERS = Object.keys(MEMBER_NAMES)

// 既存の V_CON_FOLLOW_JP_01 (sort_order=1) の後ろに 2..6 で追加
const VENUES = [
  { key: 'AICHI',   name: '愛知',   sort: 2 },
  { key: 'FUKUOKA', name: '福岡',   sort: 3 },
  { key: 'OSAKA',   name: '大阪',   sort: 4 },
  { key: 'SAITAMA', name: '埼玉',   sort: 5 },
  { key: 'TOKYO',   name: '東京',   sort: 6 },
]

console.log('Adding 5 venue versions + 65 card_master rows to P_CON_FOLLOW_JP...\n')

// 1) card_versions upsert
const versionRows = VENUES.map(v => ({
  version_id: `V_CON_FOLLOW_JP_VENUE_${v.key}`,
  product_id: PRODUCT_ID,
  version_name: v.name,
  tier: 'VENUE',
  sort_order: v.sort,
}))

const { data: existingVers } = await s.from('card_versions')
  .select('version_id')
  .in('version_id', versionRows.map(r => r.version_id))
const seenV = new Set((existingVers || []).map(r => r.version_id))
const toInsertV = versionRows.filter(r => !seenV.has(r.version_id))

if (toInsertV.length > 0) {
  const { error } = await s.from('card_versions').insert(toInsertV)
  if (error) {
    console.error('version insert err:', error.message)
    process.exit(1)
  }
  for (const r of toInsertV) console.log(`  version + ${r.version_id} (${r.version_name}, ${r.tier}, #${r.sort_order})`)
} else {
  console.log('  all versions already exist')
}

// 2) card_master rows (5 × 13 = 65)
const cmRows = []
for (const v of VENUES) {
  const versionId = `V_CON_FOLLOW_JP_VENUE_${v.key}`
  for (const mid of MEMBERS) {
    cmRows.push({
      id: `CM_P_CON_FOLLOW_JP_${v.key}_${mid}`,
      product_id: PRODUCT_ID,
      version_id: versionId,
      member_id: mid,
      member_name: MEMBER_NAMES[mid],
      card_type: 'photocard',
      card_detail: 'PhotoCard',
      front_image_url: '',
      back_image_url: '',
    })
  }
}

const { data: existingCm } = await s.from('card_master')
  .select('id')
  .in('id', cmRows.map(r => r.id))
const seenCm = new Set((existingCm || []).map(r => r.id))
const toInsertCm = cmRows.filter(r => !seenCm.has(r.id))

if (toInsertCm.length > 0) {
  // insert in chunks of 50 for safety
  for (let i = 0; i < toInsertCm.length; i += 50) {
    const chunk = toInsertCm.slice(i, i + 50)
    const { error } = await s.from('card_master').insert(chunk)
    if (error) {
      console.error('card_master insert err:', error.message)
      process.exit(1)
    }
  }
  console.log(`  card_master + ${toInsertCm.length} rows inserted`)
} else {
  console.log('  all card_master rows already exist')
}

// 3) Verification
console.log('\n=== Verification ===')
const { data: vers } = await s.from('card_versions')
  .select('version_id, version_name, tier, sort_order')
  .eq('product_id', PRODUCT_ID)
  .order('sort_order')
console.log(`versions (${vers?.length || 0}):`)
for (const r of (vers || [])) console.log(`  ${r.version_id} | ${r.version_name} | ${r.tier} | #${r.sort_order}`)

const { count: cmCount } = await s.from('card_master')
  .select('id', { count: 'exact', head: true })
  .eq('product_id', PRODUCT_ID)
console.log(`\ncard_master total rows: ${cmCount}`)

// venue 別内訳
for (const v of VENUES) {
  const verId = `V_CON_FOLLOW_JP_VENUE_${v.key}`
  const { count } = await s.from('card_master')
    .select('id', { count: 'exact', head: true })
    .eq('version_id', verId)
  console.log(`  ${verId}: ${count}`)
}

console.log('\nDone.')
