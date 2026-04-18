import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Load .env.local
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ALL_13 = ['A000001','A000002','A000003','A000004','A000005','A000006','A000007','A000008','A000009','A000010','A000011','A000012','A000013']
const NO_SCOUPS = ALL_13.filter(x => x !== 'A000002')
const SCOUPS_ENLIST = '2024-03-11'

function pad2(n) { return String(n).padStart(2, '0') }

function membersFor(releaseDate) {
  return releaseDate >= SCOUPS_ENLIST ? NO_SCOUPS : ALL_13
}

function versionIdFor(productId, sort) {
  // e.g. P_JP011 -> V_JP011_08
  const suffix = productId.replace(/^P_/, '')
  return `V_${suffix}_${pad2(sort)}`
}

async function countCardsForVersion(versionId) {
  const { count, error } = await s
    .from('card_master')
    .select('id', { count: 'exact', head: true })
    .eq('version_id', versionId)
  if (error) throw error
  return count ?? 0
}

async function totalJpCards() {
  // sum card_master rows where product_id starts with P_JP
  const { data, error } = await s
    .from('card_master')
    .select('id, product_id')
    .like('product_id', 'P_JP%')
  if (error) throw error
  return data.length
}

async function listJpProducts() {
  const { data, error } = await s
    .from('card_products')
    .select('product_id, product_name, release_date, region')
    .like('product_id', 'P_JP%')
    .order('product_id')
  if (error) throw error
  return data
}

async function insertCardsForVersion(productId, versionId, sort, members) {
  const rows = members.map(mid => ({
    id: `C_${productId}_${pad2(sort)}_${mid}`,
    product_id: productId,
    version_id: versionId,
    member_id: mid,
    card_type: 'photocard',
    card_detail: null,
    front_image_url: null,
    back_image_url: null,
  }))
  const { error } = await s.from('card_master').insert(rows)
  if (error) {
    console.log(`    insert cards error for ${versionId}: ${error.message}`)
    // try upsert (in case rows exist for some reason)
    const { error: uerr } = await s.from('card_master').upsert(rows, { onConflict: 'id' })
    if (uerr) console.log(`    upsert fallback also failed: ${uerr.message}`)
  }
  return rows.length
}

async function createVersion(productId, versionId, versionName, tier, sortOrder) {
  const row = {
    version_id: versionId,
    product_id: productId,
    version_name: versionName,
    tier,
    sort_order: sortOrder,
  }
  const { error } = await s.from('card_versions').insert(row)
  if (error) {
    console.log(`    create version error for ${versionId}: ${error.message}`)
    const { error: uerr } = await s.from('card_versions').upsert(row, { onConflict: 'version_id' })
    if (uerr) console.log(`    upsert fallback failed: ${uerr.message}`)
  }
}

async function main() {
  const before = await totalJpCards()
  console.log(`=== BEFORE: total JP card_master rows = ${before} ===\n`)

  // ------- Pre-step: dump current JP versions for reference -------
  {
    const prods = await listJpProducts()
    const pids = prods.map(p => p.product_id)
    const { data: vers } = await s
      .from('card_versions')
      .select('version_id, product_id, version_name, tier, sort_order')
      .in('product_id', pids)
      .order('product_id')
      .order('sort_order')
    console.log('--- Current JP versions ---')
    for (const v of vers) {
      const cc = await countCardsForVersion(v.version_id)
      console.log(`  ${v.product_id} | ${v.version_id} | tier=${v.tier ?? '-'} | sort=${v.sort_order ?? '-'} | ${v.version_name} | cards=${cc}`)
    }
    console.log()
  }

  // ------- Step 1: fix P_JP003 release date -------
  console.log('[Step 1] Fix P_JP003 release_date = 2019-05-29')
  {
    const { error } = await s
      .from('card_products')
      .update({ release_date: '2019-05-29' })
      .eq('product_id', 'P_JP003')
    if (error) console.log(`  error: ${error.message}`)
    else console.log('  ok')
  }

  // ------- Step 2: delete all V_JP002_* versions (ALWAYS YOURS misfiled rows) and their cards -------
  console.log('\n[Step 2] Delete V_JP002_* versions and their cards (misfiled ALWAYS YOURS on P_JP002)')
  {
    const { data: badVersions, error: vErr } = await s
      .from('card_versions')
      .select('version_id, product_id, version_name')
      .eq('product_id', 'P_JP002')
      .like('version_id', 'V_JP002_%')
    if (vErr) console.log(`  select error: ${vErr.message}`)
    console.log(`  found ${badVersions?.length ?? 0} misfiled versions on P_JP002`)
    if (badVersions && badVersions.length) {
      const ids = badVersions.map(v => v.version_id)
      const { error: delCardsErr, count: delCardsCount } = await s
        .from('card_master')
        .delete({ count: 'exact' })
        .in('version_id', ids)
      if (delCardsErr) console.log(`  delete cards error: ${delCardsErr.message}`)
      else console.log(`  deleted ${delCardsCount ?? 0} card_master rows referencing V_JP002_*`)

      const { error: delVersErr, count: delVersCount } = await s
        .from('card_versions')
        .delete({ count: 'exact' })
        .in('version_id', ids)
      if (delVersErr) console.log(`  delete versions error: ${delVersErr.message}`)
      else console.log(`  deleted ${delVersCount ?? 0} version rows`)
    }
  }

  // ------- Step 3: delete V_JP011_01 placeholder and any cards -------
  console.log('\n[Step 3] Delete V_JP011_01 placeholder')
  {
    const { error: delCardsErr, count: delCardsCount } = await s
      .from('card_master')
      .delete({ count: 'exact' })
      .eq('version_id', 'V_JP011_01')
    if (delCardsErr) console.log(`  delete cards error: ${delCardsErr.message}`)
    else console.log(`  deleted ${delCardsCount ?? 0} card_master rows`)

    const { error: delVerErr, count: delVerCount } = await s
      .from('card_versions')
      .delete({ count: 'exact' })
      .eq('version_id', 'V_JP011_01')
    if (delVerErr) console.log(`  delete version error: ${delVerErr.message}`)
    else console.log(`  deleted ${delVerCount ?? 0} version row`)
  }

  // ------- Step 4: rename V_JP001_* versions on P_JP002 -------
  console.log('\n[Step 4] Rename WE MAKE YOU (V_JP001_*) versions on P_JP002')
  {
    const { data: wmyVersions, error } = await s
      .from('card_versions')
      .select('version_id, version_name')
      .eq('product_id', 'P_JP002')
      .like('version_id', 'V_JP001_%')
    if (error) console.log(`  select error: ${error.message}`)
    const rename = { 'A': '限定A', 'B': '限定B', 'C': '限定C', 'Regular': '通常盤' }
    for (const v of wmyVersions ?? []) {
      const newName = rename[v.version_name]
      if (newName && newName !== v.version_name) {
        const { error: uErr } = await s
          .from('card_versions')
          .update({ version_name: newName })
          .eq('version_id', v.version_id)
        if (uErr) console.log(`  update ${v.version_id} error: ${uErr.message}`)
        else console.log(`  ${v.version_id}: ${v.version_name} -> ${newName}`)
      } else {
        console.log(`  ${v.version_id}: ${v.version_name} (no rename)`)
      }
    }
  }

  // ------- Step 5: rename A/B/C/Regular across P_JP003..P_JP010 -------
  console.log('\n[Step 5] Rename A/B/C/Regular across P_JP003..P_JP010')
  {
    const targets = ['P_JP003','P_JP004','P_JP005','P_JP006','P_JP007','P_JP008','P_JP009','P_JP010']
    const rename = { 'A': '限定A', 'B': '限定B', 'C': '限定C', 'Regular': '通常盤' }
    for (const pid of targets) {
      const { data: vers, error } = await s
        .from('card_versions')
        .select('version_id, version_name')
        .eq('product_id', pid)
      if (error) { console.log(`  ${pid} select error: ${error.message}`); continue }
      for (const v of vers ?? []) {
        const newName = rename[v.version_name]
        if (newName && newName !== v.version_name) {
          const { error: uErr } = await s
            .from('card_versions')
            .update({ version_name: newName })
            .eq('version_id', v.version_id)
          if (uErr) console.log(`    update ${v.version_id} error: ${uErr.message}`)
          else console.log(`  ${pid} ${v.version_id}: ${v.version_name} -> ${newName}`)
        }
      }
    }
  }

  // ------- Step 6: add missing versions and empty card rows -------
  console.log('\n[Step 6] Add missing versions + empty card_master rows')

  // Standard tier mapping
  // tier: 1 = 限定A/B/C/D etc, 2 = 通常盤, 3 = shop exclusives
  function tierFor(name) {
    if (name.startsWith('限定')) return 1
    if (name === '通常盤') return 2
    return 3
  }

  const plan = [
    {
      product_id: 'P_JP003', release_date: '2019-05-29',
      missing: ['CARAT盤'],
    },
    {
      product_id: 'P_JP004', release_date: '2020-04-01',
      missing: ['CARAT盤'],
    },
    {
      product_id: 'P_JP005', release_date: '2020-09-09',
      missing: ['限定C', 'CARAT盤'],
    },
    {
      product_id: 'P_JP006', release_date: '2021-04-21',
      missing: ['限定C', '限定D'],
    },
    {
      product_id: 'P_JP008', release_date: '2022-11-09',
      missing: ['限定C', '限定D', 'フラッシュプライス盤', 'CARAT盤'],
    },
    {
      product_id: 'P_JP010', release_date: '2024-11-27',
      missing: ['フラッシュプライス盤', 'CARAT盤'],
    },
    {
      product_id: 'P_JP011', release_date: '2023-08-23',
      missing: ['限定A', '限定B', '限定C', '限定D', '通常盤', 'セブンネット盤', 'フラッシュプライス盤', 'CARAT盤'],
    },
  ]

  for (const item of plan) {
    console.log(`\n  -- ${item.product_id} (${item.release_date}) --`)
    const members = membersFor(item.release_date)

    // Find current max sort_order for this product
    const { data: existing, error: eErr } = await s
      .from('card_versions')
      .select('version_id, sort_order, version_name')
      .eq('product_id', item.product_id)
      .order('sort_order', { ascending: false })
    if (eErr) { console.log(`    select existing error: ${eErr.message}`); continue }
    let nextSort = (existing && existing.length)
      ? (Math.max(...existing.map(v => v.sort_order ?? 0)) + 1)
      : 1

    // Also compute next numeric suffix for version_id (based on existing V_JPxxx_NN)
    const suffix = item.product_id.replace(/^P_/, '')
    const idRe = new RegExp(`^V_${suffix}_(\\d+)$`)
    let nextNum = 1
    for (const v of existing ?? []) {
      const m = v.version_id.match(idRe)
      if (m) nextNum = Math.max(nextNum, parseInt(m[1], 10) + 1)
    }
    // Also consider that existing non-conforming version_ids might already use numbers from _01..
    // We'll just step from the max we saw
    if (existing && existing.length && nextNum === 1) {
      // fallback: just use existing count + 1
      nextNum = existing.length + 1
    }

    for (const name of item.missing) {
      const sort = nextSort++
      const numForId = nextNum++
      const versionId = `V_${suffix}_${pad2(numForId)}`

      // Check if this exact version_id collides
      const { data: clash } = await s
        .from('card_versions')
        .select('version_id')
        .eq('version_id', versionId)
      if (clash && clash.length) {
        console.log(`    skip: ${versionId} already exists`)
        continue
      }

      const tier = tierFor(name)
      await createVersion(item.product_id, versionId, name, tier, sort)
      const inserted = await insertCardsForVersion(item.product_id, versionId, sort, members)
      console.log(`    created ${versionId} (${name}, tier=${tier}, sort=${sort}) with ${inserted} cards`)
    }
  }

  // ------- Step 7: verification -------
  console.log('\n[Step 7] Verification summary')
  const prods = await listJpProducts()
  const pids = prods.map(p => p.product_id)
  const { data: allVersions, error: vErr } = await s
    .from('card_versions')
    .select('version_id, product_id, version_name, tier, sort_order')
    .in('product_id', pids)
    .order('product_id')
    .order('sort_order')
  if (vErr) console.log(`  select error: ${vErr.message}`)

  const byProd = new Map()
  for (const p of prods) byProd.set(p.product_id, { prod: p, versions: [] })
  for (const v of allVersions ?? []) byProd.get(v.product_id)?.versions.push(v)

  console.log('\nproduct_id | version_id | tier | sort | name | cards')
  console.log('-'.repeat(80))
  for (const [pid, { prod, versions }] of byProd) {
    console.log(`\n# ${pid} | ${prod.product_name} | release=${prod.release_date}`)
    if (!versions.length) {
      console.log('  (no versions)')
      continue
    }
    for (const v of versions) {
      const cc = await countCardsForVersion(v.version_id)
      console.log(`  ${v.product_id} | ${v.version_id} | tier=${v.tier ?? '-'} | sort=${v.sort_order ?? '-'} | ${v.version_name} | cards=${cc}`)
    }
  }

  const after = await totalJpCards()
  console.log(`\n=== AFTER: total JP card_master rows = ${after} (delta: ${after - before}) ===`)
}

main().catch(e => {
  console.error('FATAL:', e)
  process.exit(1)
})
