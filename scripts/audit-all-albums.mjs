// 全アルバムのメンバー別カウント監査
// ルール: JEONGHAN は Happy Burstday (P_KR023) のみ 0 で OK、それ以外はメンバー全員同数であるべき
// 店舗特典 5店舗 (HMV/TOWER/TSUTAYA/UMS/WEVERSE) の有無も確認
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const MEMBERS = Array.from({length: 13}, (_, i) => `A${String(i+1).padStart(6, '0')}`)
const NAMES = ['S.COUPS', 'JEONGHAN', 'JOSHUA', 'JUN', 'HOSHI', 'WONWOO', 'WOOZI', 'THE 8', 'MINGYU', 'DK', 'SEUNGKWAN', 'VERNON', 'DINO']

const STORE_KEYS = ['HMV', 'TOWER', 'TSUTAYA', 'UMS', 'WEVERSE']

const { data: products } = await s.from('card_products').select('product_id, product_name, region, release_date').order('release_date', { ascending: false })

const issues = []
for (const p of products) {
  // Per-version per-member count
  const { data: vers } = await s.from('card_versions').select('version_id, version_name, tier').eq('product_id', p.product_id)
  const { data: cards } = await s.from('card_master').select('version_id, member_id').eq('product_id', p.product_id)
  if (!cards || cards.length === 0) continue

  // Count per version per member
  const countMap = new Map()  // versionId → memberId → count
  for (const c of cards) {
    if (!countMap.has(c.version_id)) countMap.set(c.version_id, new Map())
    const m = countMap.get(c.version_id)
    m.set(c.member_id, (m.get(c.member_id) || 0) + 1)
  }

  // For each version check members match
  for (const v of vers || []) {
    const m = countMap.get(v.version_id) || new Map()
    if (m.size === 0) continue  // version with no cards
    const counts = MEMBERS.map(mid => m.get(mid) || 0)
    // Expected per-member count: mode, excluding JEONGHAN in Happy Burstday
    const freq = new Map()
    for (const c of counts) if (c > 0) freq.set(c, (freq.get(c) || 0) + 1)
    if (freq.size === 0) continue
    let expected = 0
    let maxF = 0
    for (const [val, fr] of freq) if (fr > maxF) { expected = val; maxF = fr }

    // Find members that don't match expected
    const missing = []
    for (let i = 0; i < MEMBERS.length; i++) {
      const mid = MEMBERS[i]
      const c = counts[i]
      if (c === expected) continue
      // Skip JEONGHAN in HAPPY BURSTDAY (product P_KR023) as 0 is intentional
      if (p.product_id === 'P_KR023' && mid === 'A000002' && c === 0) continue
      missing.push(`${NAMES[i]}=${c}(expected ${expected})`)
    }
    if (missing.length > 0) {
      issues.push({ productId: p.product_id, productName: p.product_name, versionId: v.version_id, versionName: v.version_name || '', issue: missing.join(', ') })
    }
  }

  // Check store benefit completeness: for modern KR albums, each tier should have all 5 stores
  // Look for store-tagged versions
  const storeVersions = (vers || []).filter(v => /_BEN_|STORE/i.test(v.version_id) || v.tier === 'STORE_JP' || v.tier === 'STORE_KR')
  const storesSeen = new Set()
  for (const v of storeVersions) {
    for (const k of STORE_KEYS) {
      if (v.version_id.includes(k)) storesSeen.add(k)
    }
  }
  if (storeVersions.length > 0 && storesSeen.size < STORE_KEYS.length) {
    const missing = STORE_KEYS.filter(k => !storesSeen.has(k))
    issues.push({ productId: p.product_id, productName: p.product_name, versionId: '(store benefits)', versionName: '', issue: `missing stores: ${missing.join(', ')}` })
  }
}

console.log(`\n=== Issues found: ${issues.length} ===\n`)
for (const i of issues) {
  console.log(`${i.productId} ${i.productName}`)
  console.log(`  ${i.versionId} ${i.versionName}`)
  console.log(`  → ${i.issue}\n`)
}
