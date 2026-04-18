import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Cutoff: post-2024-03-11 albums are 12 members (S.COUPS absent due to hiatus)
const CUTOFF = '2024-03-11'
const ALL_MEMBERS = Array.from({ length: 13 }, (_, i) => `A${String(i + 1).padStart(6, '0')}`)
const POST_CUTOFF_MEMBERS = ALL_MEMBERS.filter(id => id !== 'A000002') // S.COUPS absent

// Fetch all SEVENTEEN products. We assume region JP/KR both belong to SEVENTEEN group.
// Let's inspect via group_name if present.
const { data: allProducts } = await s
  .from('card_products')
  .select('product_id, product_name, region, release_date, group_name')
  .order('release_date', { ascending: true })

// Filter to SEVENTEEN. Treat group_name = 'SEVENTEEN' OR null fallback on known ID prefixes.
const products = (allProducts || []).filter(p => {
  if (p.group_name) return p.group_name === 'SEVENTEEN'
  return p.product_id.startsWith('P_JP') || p.product_id.startsWith('P_KR')
})

console.log(`# Auditing ${products.length} SEVENTEEN products\n`)

const findings = [] // { severity, category, product, tier, version_id, version_name, msg, fix }
const add = (f) => findings.push(f)

// Pre-fetch all versions and card_master rows to reduce round trips
const productIds = products.map(p => p.product_id)

const { data: versions } = await s
  .from('card_versions')
  .select('version_id, product_id, version_name, tier, sort_order')
  .in('product_id', productIds)

const versionsByProduct = new Map()
for (const v of versions || []) {
  if (!versionsByProduct.has(v.product_id)) versionsByProduct.set(v.product_id, [])
  versionsByProduct.get(v.product_id).push(v)
}

// Fetch card_master rows for these versions - paginate
const versionIds = (versions || []).map(v => v.version_id)
let cardsByVersion = new Map()
const chunkSize = 300
for (let i = 0; i < versionIds.length; i += chunkSize) {
  const chunk = versionIds.slice(i, i + chunkSize)
  const { data: rows } = await s
    .from('card_master')
    .select('id, product_id, version_id, member_id, card_type, card_detail')
    .in('version_id', chunk)
  for (const r of rows || []) {
    if (!cardsByVersion.has(r.version_id)) cardsByVersion.set(r.version_id, [])
    cardsByVersion.get(r.version_id).push(r)
  }
}

// Also detect orphan card_master rows - those referencing non-existent version_ids/product_ids
// We only focus on SEVENTEEN scope: look for card_master where product_id is one of ours but version_id is unknown
{
  const { data: allCards } = await s
    .from('card_master')
    .select('id, product_id, version_id')
    .in('product_id', productIds)
  const knownVersionIds = new Set(versionIds)
  const orphans = (allCards || []).filter(c => !knownVersionIds.has(c.version_id))
  const orphansGrouped = new Map()
  for (const o of orphans) {
    const key = `${o.product_id}::${o.version_id}`
    orphansGrouped.set(key, (orphansGrouped.get(key) || 0) + 1)
  }
  for (const [key, count] of orphansGrouped) {
    const [pid, vid] = key.split('::')
    const prod = products.find(p => p.product_id === pid)
    add({
      severity: 1,
      category: 'ORPHAN',
      product: prod,
      tier: null,
      version_id: vid,
      version_name: null,
      msg: `${count} card_master rows reference version_id=${vid} which does NOT exist in card_versions`,
      fix: `delete these orphan rows or recreate the version row`
    })
  }
}

// Go through each product
for (const p of products) {
  const vs = versionsByProduct.get(p.product_id) || []
  const isPost = p.release_date >= CUTOFF
  const expectedMemberCount = isPost ? 12 : 13
  const expectedMembers = new Set(isPost ? POST_CUTOFF_MEMBERS : ALL_MEMBERS)

  // 4. Misfiled version_id prefix
  for (const v of vs) {
    // strip P_ and V_ then compare core token
    const pCore = p.product_id.replace(/^P_/, '')
    const vCore = v.version_id.replace(/^V_/, '')
    // Typical pattern: version_id like V_JP011_xxx for product P_JP011
    // Extract product-scoped prefix: everything up to trailing _digits or _alpha tail - use first two tokens split by _
    // Simpler: check that vCore startsWith pCore + '_' or contains pCore
    if (!vCore.startsWith(pCore + '_') && !vCore.startsWith(pCore)) {
      add({
        severity: 1,
        category: 'MISFILED',
        product: p,
        tier: v.tier,
        version_id: v.version_id,
        version_name: v.version_name,
        msg: `version_id prefix does not match product_id`,
        fix: `move to the product that matches "${vCore.split('_').slice(0, 2).join('_')}" prefix`
      })
    }
  }

  // Parse bases
  const parsed = vs.map(v => {
    const parts = (v.version_name || '').split(' - ')
    const base = parts[0] ?? ''
    const store = parts.length > 1 ? parts.slice(1).join(' - ') : null
    return { ...v, base, store }
  })

  // Group by tier
  const byTier = new Map()
  for (const v of parsed) {
    const t = v.tier || 'NULL'
    if (!byTier.has(t)) byTier.set(t, [])
    byTier.get(t).push(v)
  }

  // 5. Weird formatting
  for (const v of parsed) {
    const name = v.version_name || ''
    if (name !== name.trim()) {
      add({ severity: 3, category: 'FORMATTING', product: p, tier: v.tier, version_id: v.version_id, version_name: name, msg: `leading/trailing whitespace`, fix: `trim whitespace` })
    }
    if (!name) {
      add({ severity: 1, category: 'FORMATTING', product: p, tier: v.tier, version_id: v.version_id, version_name: name, msg: `empty version_name`, fix: `set a proper name` })
    }
    // lowercase-only base (single letter or like "limited c")
    const baseTrim = v.base.trim()
    if (baseTrim && baseTrim === baseTrim.toLowerCase() && /[a-z]/.test(baseTrim) && !/\d/.test(baseTrim) && baseTrim.length < 20) {
      // skip if it's ALL non-english (japanese/korean only)
      add({ severity: 3, category: 'FORMATTING', product: p, tier: v.tier, version_id: v.version_id, version_name: name, msg: `lowercase-only base "${baseTrim}"`, fix: `title-case it (e.g. "${baseTrim.replace(/\b\w/g, c => c.toUpperCase())}")` })
    }
    // unusual separators (multiple dashes, or dash without spaces)
    if (/\S-\S/.test(name) && !name.includes(' - ')) {
      add({ severity: 3, category: 'FORMATTING', product: p, tier: v.tier, version_id: v.version_id, version_name: name, msg: `dash without spaces - won't split into base/store`, fix: `use " - " (space-dash-space) as separator` })
    }
    if (/ {2,}/.test(name)) {
      add({ severity: 3, category: 'FORMATTING', product: p, tier: v.tier, version_id: v.version_id, version_name: name, msg: `multiple consecutive spaces`, fix: `collapse to single space` })
    }
  }

  // 1 & 3. INCLUDED tier: check bases that have 1-card-per-member, look for single-base pairing problems, duplicate bases
  const INCLUDED = byTier.get('INCLUDED') || []
  const includedByBase = new Map()
  for (const v of INCLUDED) {
    if (!includedByBase.has(v.base)) includedByBase.set(v.base, [])
    includedByBase.get(v.base).push(v)
  }
  // Duplicate bases in INCLUDED (same base name >1 row)
  for (const [base, vlist] of includedByBase) {
    if (vlist.length > 1) {
      add({
        severity: 2,
        category: 'DUPLICATE_BASE',
        product: p,
        tier: 'INCLUDED',
        version_id: vlist.map(v => v.version_id).join(','),
        version_name: base,
        msg: `${vlist.length} INCLUDED versions share base "${base}": ${vlist.map(v => v.version_name).join(' | ')}`,
        fix: `rename or delete duplicates so each base is unique`
      })
    }
  }
  // For INCLUDED: count cards-per-member per base (sum across matching versions) - we want the 1-per-member case
  // Actually simpler: count cards per member within the base's single version (assume no duplicate base for cleanliness here)
  const onePerMemberBases = []
  for (const [base, vlist] of includedByBase) {
    // count distinct members where each member has exactly one card across all versions in this base
    const memberCardCount = new Map()
    for (const v of vlist) {
      const cards = cardsByVersion.get(v.version_id) || []
      for (const c of cards) memberCardCount.set(c.member_id, (memberCardCount.get(c.member_id) || 0) + 1)
    }
    const members = [...memberCardCount.keys()]
    const allOne = members.length === expectedMemberCount && members.every(m => memberCardCount.get(m) === 1)
    if (allOne) onePerMemberBases.push(base)
  }
  if (onePerMemberBases.length === 1) {
    add({
      severity: 2,
      category: 'SINGLETON_BASE',
      product: p,
      tier: 'INCLUDED',
      version_id: null,
      version_name: onePerMemberBases[0],
      msg: `only 1 INCLUDED base with 1-card-per-member ("${onePerMemberBases[0]}"); renders alone full-width (no pairing)`,
      fix: `either add a paired base (e.g. LOVE + LETTER pattern) or accept the lone full-width row`
    })
  }

  // Duplicate bases in other tiers too
  for (const [tier, list] of byTier) {
    if (tier === 'INCLUDED') continue
    const byBase = new Map()
    for (const v of list) {
      if (!byBase.has(v.base)) byBase.set(v.base, [])
      byBase.get(v.base).push(v)
    }
    for (const [base, vlist] of byBase) {
      if (vlist.length > 1 && !tier.startsWith('STORE_')) {
        add({
          severity: 2,
          category: 'DUPLICATE_BASE',
          product: p,
          tier,
          version_id: vlist.map(v => v.version_id).join(','),
          version_name: base,
          msg: `${vlist.length} ${tier} versions share base "${base}"`,
          fix: `merge or rename so each base is unique in this tier`
        })
      }
    }
  }

  // 2. Mismatched card counts per version (not 13, or 12 post-cutoff)
  for (const v of parsed) {
    const cards = cardsByVersion.get(v.version_id) || []
    if (cards.length === 0) {
      add({
        severity: 1,
        category: 'EMPTY_VERSION',
        product: p,
        tier: v.tier,
        version_id: v.version_id,
        version_name: v.version_name,
        msg: `0 card_master rows`,
        fix: `either populate cards or delete this version`
      })
      continue
    }
    // Count unique members
    const memberSet = new Set(cards.map(c => c.member_id))
    if (cards.length !== expectedMemberCount || memberSet.size !== expectedMemberCount) {
      // Only flag if it's not a multi-card-per-member intentional thing (e.g. LUCKY_DRAW sometimes has different structure)
      // but let's report any deviation with context
      const missing = [...expectedMembers].filter(m => !memberSet.has(m))
      const extra = [...memberSet].filter(m => !expectedMembers.has(m))
      add({
        severity: cards.length === 0 ? 1 : 2,
        category: 'CARD_COUNT',
        product: p,
        tier: v.tier,
        version_id: v.version_id,
        version_name: v.version_name,
        msg: `${cards.length} cards, ${memberSet.size} unique members (expected ${expectedMemberCount}${missing.length ? `; missing ${missing.join(',')}` : ''}${extra.length ? `; extra ${extra.join(',')}` : ''})`,
        fix: `backfill missing members or dedupe extras`
      })
    }
  }

  // 8. Inconsistent member coverage across versions of same product
  const memberSetsByVersion = new Map()
  for (const v of parsed) {
    const cards = cardsByVersion.get(v.version_id) || []
    memberSetsByVersion.set(v.version_id, new Set(cards.map(c => c.member_id)))
  }
  const coverageSummary = new Set()
  for (const ms of memberSetsByVersion.values()) {
    coverageSummary.add([...ms].sort().join(','))
  }
  if (coverageSummary.size > 1) {
    // Already reported per-version in CARD_COUNT, but also note at product-level
    const sizes = [...memberSetsByVersion.values()].map(ms => ms.size)
    const uniq = [...new Set(sizes)].sort()
    if (uniq.length > 1) {
      add({
        severity: 2,
        category: 'INCONSISTENT_COVERAGE',
        product: p,
        tier: null,
        version_id: null,
        version_name: null,
        msg: `versions cover different member counts: ${uniq.join(' vs ')}`,
        fix: `standardize member coverage across versions`
      })
    }
  }

  // 6. STORE tier anomalies - pivot: group by tier=STORE_JP/STORE_KR, then sub count per store (base becomes store-value)
  for (const [tier, list] of byTier) {
    if (!tier.startsWith('STORE_')) continue
    // Under store-first pivot, each version has base=storeName (pre-dash) and store=subName (post-dash)
    // Count subs per store
    const subsPerStore = new Map()
    for (const v of list) {
      const storeKey = v.base // the pre-dash part is the store under pivot
      if (!subsPerStore.has(storeKey)) subsPerStore.set(storeKey, [])
      subsPerStore.get(storeKey).push(v)
    }
    for (const [store, subs] of subsPerStore) {
      if (subs.length === 1) {
        add({
          severity: 3,
          category: 'STORE_SINGLETON',
          product: p,
          tier,
          version_id: subs[0].version_id,
          version_name: subs[0].version_name,
          msg: `${tier} store "${store}" has only 1 sub — no pair to render side-by-side`,
          fix: `add a paired sub or accept lone row`
        })
      }
      // Duplicate sub names within a store (same sub key twice) - that's a bug
      const subNames = subs.map(v => v.store)
      const dup = subNames.filter((n, i) => subNames.indexOf(n) !== i)
      for (const d of [...new Set(dup)]) {
        add({
          severity: 2,
          category: 'DUPLICATE_STORE_SUB',
          product: p,
          tier,
          version_id: subs.filter(v => v.store === d).map(v => v.version_id).join(','),
          version_name: `${store} - ${d}`,
          msg: `store "${store}" has duplicate sub "${d}"`,
          fix: `rename or delete duplicate sub`
        })
      }
    }

    // If any store-tier version has no " - " separator, base/store pivot breaks
    for (const v of list) {
      if (!v.store) {
        add({
          severity: 2,
          category: 'STORE_NO_SEPARATOR',
          product: p,
          tier,
          version_id: v.version_id,
          version_name: v.version_name,
          msg: `${tier} version has no " - " separator, pivot treats entire name as store`,
          fix: `rename to "StoreName - SubName" format`
        })
      }
    }
  }
}

// Sort by severity then product release_date
findings.sort((a, b) => {
  if (a.severity !== b.severity) return a.severity - b.severity
  const aDate = a.product?.release_date || ''
  const bDate = b.product?.release_date || ''
  return aDate.localeCompare(bDate)
})

console.log(`\n# TOTAL FINDINGS: ${findings.length}\n`)

const grouped = new Map()
for (const f of findings) {
  const key = f.product?.product_id || 'GLOBAL'
  if (!grouped.has(key)) grouped.set(key, [])
  grouped.get(key).push(f)
}

const sevLabel = (n) => ({ 1: 'HIGH', 2: 'MED ', 3: 'LOW ' }[n] || '?')

for (const [pid, flist] of grouped) {
  const p = flist[0].product
  const header = p
    ? `## ${p.product_id} | ${p.release_date} | ${p.product_name}`
    : `## ${pid}`
  console.log(header)
  for (const f of flist) {
    const tierBit = f.tier ? `[${f.tier}]` : '[-]'
    const vnBit = f.version_name ? ` "${f.version_name}"` : ''
    const vidBit = f.version_id ? ` (${f.version_id})` : ''
    console.log(`  [${sevLabel(f.severity)}] ${f.category} ${tierBit}${vnBit}${vidBit}`)
    console.log(`         ${f.msg}`)
    console.log(`         FIX: ${f.fix}`)
  }
  console.log()
}

// Summary by category
console.log('# SUMMARY BY CATEGORY')
const catCounts = new Map()
for (const f of findings) catCounts.set(f.category, (catCounts.get(f.category) || 0) + 1)
for (const [cat, n] of [...catCounts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${n}`)
}
