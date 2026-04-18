// scripts/fix-all-album-orders.mjs
//
// Fix album version ordering + PHOTOCARD enclosure counts for SEVENTEEN KR
// albums, based on the official discography pages at seventeen-17.jp.
//
// Data source: discography detail pages on seventeen-17.jp/posts/discography/<slug>,
// scraped once and inlined below as `spec`.
//
// Side effects:
//   - ensures card_versions.sort_order exists (via exec_sql RPC if available;
//     otherwise run scripts/add-version-sort-order.sql manually first)
//   - sets sort_order per version to match the official release order
//   - where PHOTOCARD total per version doesn't match card_master count for
//     that version, rebuilds card_master rows for that version
//     (13 members * (total / 13) cards each).
//
// Run:
//   node scripts/fix-all-album-orders.mjs
//
// Env: loaded from ../.env.local (same pattern as other scripts/*.mjs).

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// ── env ─────────────────────────────────────────────────────────────
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// ── members (canonical 13) ──────────────────────────────────────────
const MEMBERS = [
  { id: 'A000001', name: 'S.COUPS' },
  { id: 'A000002', name: 'JEONGHAN' },
  { id: 'A000003', name: 'JOSHUA' },
  { id: 'A000004', name: 'JUN' },
  { id: 'A000005', name: 'HOSHI' },
  { id: 'A000006', name: 'WONWOO' },
  { id: 'A000007', name: 'WOOZI' },
  { id: 'A000008', name: 'THE 8' },
  { id: 'A000009', name: 'MINGYU' },
  { id: 'A000010', name: 'DK' },
  { id: 'A000011', name: 'SEUNGKWAN' },
  { id: 'A000012', name: 'VERNON' },
  { id: 'A000013', name: 'DINO' },
]

// ── scraped spec ────────────────────────────────────────────────────
// Source of truth: https://www.seventeen-17.jp/posts/discography/<slug>
// photocard_total = total unique PHOTOCARD designs per version
// (parsed from Japanese text like "XX種中YY種ランダム" / "XX種").
// null = page did not specify (usually KiT/Weverse or store-benefit
// entries) — keep sort_order, skip card count rebuild.
const spec = {
  albums: {
    P_KR023: {
      title: 'Happy Burstday', slug: 'incaiv',
      versions: [
        { name: 'NEW ESCAPE Ver.',       photocard_total: null },
        { name: 'NEW MYSELF Ver.',       photocard_total: null },
        { name: 'NEW BURSTDAY Ver.',     photocard_total: null },
        { name: 'DAREDEVIL Ver.',        photocard_total: null },
        { name: 'Weverse Albums Ver.',   photocard_total: null },
        { name: 'KiT NEW ESCAPE Ver.',   photocard_total: null },
        { name: 'KiT NEW BURSTDAY Ver.', photocard_total: null },
      ],
    },
    P_KR022: {
      title: 'SPILL THE FEELS', slug: 'xlrnjm',
      versions: [
        { name: 'FEEL BLUE',    photocard_total: 26 },
        { name: 'FEEL NEW',     photocard_total: 26 },
        { name: 'FEEL YOU',     photocard_total: 26 },
        { name: 'CARAT',        photocard_total: 52 },
        { name: 'kit',          photocard_total: null },
        { name: 'weverse ver.', photocard_total: null },
      ],
    },
    P_KR021: {
      title: '17 IS RIGHT HERE', slug: 'dkmcme',
      versions: [
        { name: 'HERE',         photocard_total: 26 },
        { name: 'HEAR',         photocard_total: 26 },
        { name: 'DEAR',         photocard_total: 52 },
        { name: 'limited b',    photocard_total: null },
        { name: 'limited c',    photocard_total: null },
        { name: 'limited d',    photocard_total: null },
        { name: 'flash price',  photocard_total: null },
        { name: 'carat',        photocard_total: null },
      ],
    },
    P_KR019: {
      title: 'SEVENTEENTH HEAVEN', slug: 'smakmm',
      versions: [
        { name: 'AM 5:26',      photocard_total: 26 },
        { name: 'PM 2:14',      photocard_total: 26 },
        { name: 'PM 10:23',     photocard_total: 26 },
        { name: 'CARAT ver.',   photocard_total: 52 },
        { name: 'kit',          photocard_total: null },
        { name: 'weverse ver.', photocard_total: null },
      ],
    },
    P_KR018: {
      title: 'FML', slug: 'xmsjsm',
      versions: [
        { name: 'FULL OF LOVE',      photocard_total: 26 },
        { name: 'FIGHT FOR MY LIFE', photocard_total: 26 },
        { name: 'FADED MONO LIFE',   photocard_total: 26 },
        { name: 'CARAT ver.',        photocard_total: 52 },
      ],
    },
    P_KR017: {
      title: 'Sector 17', slug: 'atwpya',
      versions: [
        { name: 'NEW HEIGHTS',   photocard_total: 26 },
        { name: 'NEW BEGINNING', photocard_total: 26 },
        { name: 'COMPACT',       photocard_total: 26 },
      ],
    },
    P_KR016: {
      title: 'Face the Sun', slug: 'hrhcnu',
      versions: [
        { name: 'ep.1 Control',              photocard_total: 52 },
        { name: 'ep.2 Shadow',               photocard_total: 52 },
        { name: 'ep.3 Ray',                  photocard_total: 52 },
        { name: 'ep.4 Path',                 photocard_total: 52 },
        { name: 'ep.5 Pioneer (CARAT ver.)', photocard_total: 52 },
      ],
    },
    P_KR015: {
      title: 'Attacca', slug: 'oamarv',
      versions: [
        { name: 'Op.1', photocard_total: 26 },
        { name: 'Op.2', photocard_total: 26 },
        { name: 'Op.3', photocard_total: 26 },
      ],
    },
    P_KR014: {
      title: 'Your Choice', slug: 'acyyeq',
      versions: [
        { name: 'ONE SIDE',   photocard_total: 13 },
        { name: 'OTHER SIDE', photocard_total: 13 },
        { name: 'BESIDE',     photocard_total: 13 },
        { name: 'limited c',  photocard_total: null },
        { name: 'carat',      photocard_total: null },
      ],
    },
    P_KR013: {
      title: '; [Semicolon]', slug: 'uxevdk',
      versions: [
        { name: 'standard', photocard_total: 26 },
      ],
    },
    P_KR012: {
      title: 'Heng:garae', slug: 'pznrxa',
      versions: [
        { name: 'HANA',  photocard_total: 26 },
        { name: 'DUL',   photocard_total: 26 },
        { name: 'SET',   photocard_total: 26 },
        { name: 'NET',   photocard_total: 26 },
        { name: 'carat', photocard_total: null },
      ],
    },
    P_KR011: {
      title: 'An Ode', slug: 'mnqvfc',
      versions: [
        { name: 'Begin',   photocard_total: 52 },
        { name: 'Hope',    photocard_total: 52 },
        { name: 'Truth',   photocard_total: 52 },
        { name: 'Fear',    photocard_total: 52 },
        { name: 'Journey', photocard_total: 52 },
      ],
    },
    P_KR010: {
      title: 'You Made My Dawn', slug: 'xpgmhf',
      versions: [
        { name: 'BEFORE DAWN',      photocard_total: 26 },
        { name: 'DAWN',             photocard_total: 26 },
        { name: 'ETERNAL SUNSHINE', photocard_total: 26 },
        { name: 'limited c',        photocard_total: null },
        { name: 'carat',            photocard_total: null },
      ],
    },
    P_KR009: {
      title: 'You Make My Day', slug: 'tvgqhs',
      versions: [
        { name: 'MEET',   photocard_total: 26 },
        { name: 'FOLLOW', photocard_total: 26 },
        { name: 'SET',    photocard_total: 26 },
      ],
    },
  },
}

// ── normalize helper for fuzzy name matching ────────────────────────
function norm(s) {
  return (s || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()（）\[\]【】「」『』]/g, '')
    .replace(/[・·.,]/g, '')
    .replace(/ver\.?$/i, '')
    .replace(/ver\.?/gi, '')
}

// Pick the best-matching DB version row for a scraped version entry.
// Strategy: exact normalized match, then "scraped name is contained in db name"
// (or vice versa). Returns the matched DB row or null.
function findMatch(scrapedName, dbVersions, alreadyUsed) {
  const target = norm(scrapedName)
  // 1) exact normalized match
  for (const v of dbVersions) {
    if (alreadyUsed.has(v.version_id)) continue
    if (norm(v.version_name) === target) return v
  }
  // 2) contained either way
  for (const v of dbVersions) {
    if (alreadyUsed.has(v.version_id)) continue
    const n = norm(v.version_name)
    if (!n || !target) continue
    if (n.includes(target) || target.includes(n)) return v
  }
  return null
}

// Only operate on "base" versions (not store-benefit rows).
// Those use the pattern V_XXXNNN_<digits>. Benefit rows contain "_BEN_" or "_LUCKY_".
function isBaseVersion(version_id) {
  return !/_BEN_|_LUCKY_/.test(version_id)
}

// ── ensure sort_order column exists ─────────────────────────────────
async function ensureSortOrderColumn() {
  const DDL = `ALTER TABLE card_versions
    ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;
  CREATE INDEX IF NOT EXISTS card_versions_product_sort_idx
    ON card_versions (product_id, sort_order, version_id);`
  const { error } = await supabase.rpc('exec_sql', { sql: DDL })
  if (error) {
    console.log('  exec_sql RPC failed; please run scripts/add-version-sort-order.sql manually.')
    console.log('  reason:', error.message)
    return false
  }
  console.log('  sort_order column ensured via exec_sql RPC')
  return true
}

// ── rebuild card_master for one version to match a target count ─────
async function rebuildCardMaster(productId, versionId, totalDesigns) {
  if (totalDesigns % 13 !== 0) {
    console.log(`    skip rebuild ${versionId}: total=${totalDesigns} not divisible by 13`)
    return { skipped: true }
  }
  const perMember = totalDesigns / 13
  // Delete user_cards referencing these, then card_master rows for this version.
  await supabase.from('user_cards').delete().eq('version_id', versionId)
  await supabase.from('card_master').delete().eq('version_id', versionId)

  const productNum = productId.replace(/^P_/, '')
  const versionSuffix = versionId.split('_').pop()
  const rows = []
  let idx = 1
  for (const m of MEMBERS) {
    for (let i = 1; i <= perMember; i++) {
      rows.push({
        id: `CM_${productNum}_${versionSuffix}_${String(idx).padStart(3, '0')}`,
        product_id: productId,
        version_id: versionId,
        member_id: m.id,
        member_name: m.name,
        card_type: 'photocard',
        card_detail: `Photocard ${i}`,
        front_image_url: '',
        back_image_url: '',
      })
      idx++
    }
  }
  const { error } = await supabase.from('card_master').upsert(rows, { onConflict: 'id' })
  if (error) throw error
  return { inserted: rows.length, perMember }
}

// ── main ────────────────────────────────────────────────────────────
console.log('== Ensure sort_order column ==')
await ensureSortOrderColumn()

const report = []

for (const [productId, album] of Object.entries(spec.albums || {})) {
  console.log('')
  console.log(`== ${productId}  ${album.title} ==`)
  const row = { product_id: productId, title: album.title, versions: [], notes: [] }
  report.push(row)

  // Load all DB versions for this product.
  const { data: dbVersions, error: verErr } = await supabase
    .from('card_versions')
    .select('version_id, version_name, product_id, tier')
    .eq('product_id', productId)
  if (verErr) {
    console.log('  ERR load versions:', verErr.message)
    row.notes.push(`load_versions_err: ${verErr.message}`)
    continue
  }
  const baseDb = (dbVersions || []).filter(v => isBaseVersion(v.version_id))

  const used = new Set()
  let orderIdx = 1
  for (const scraped of album.versions) {
    const match = findMatch(scraped.name, baseDb, used)
    if (!match) {
      console.log(`  no DB match for "${scraped.name}" — skipping`)
      row.notes.push(`no_match:${scraped.name}`)
      continue
    }
    used.add(match.version_id)

    // 1) set sort_order
    const so = orderIdx++
    const { error: upErr } = await supabase
      .from('card_versions')
      .update({ sort_order: so })
      .eq('version_id', match.version_id)
    if (upErr) {
      console.log(`    ERR setting sort_order on ${match.version_id}: ${upErr.message}`)
      row.notes.push(`sort_order_err:${match.version_id}`)
    }

    // 2) compare photocard count
    const { count: currentCount } = await supabase
      .from('card_master')
      .select('*', { count: 'exact', head: true })
      .eq('version_id', match.version_id)

    let pcAction = 'ok'
    if (scraped.photocard_total && currentCount !== scraped.photocard_total) {
      if (scraped.photocard_total % 13 === 0) {
        console.log(`  rebuild cards for ${match.version_id}: ${currentCount} -> ${scraped.photocard_total}`)
        try {
          await rebuildCardMaster(productId, match.version_id, scraped.photocard_total)
          pcAction = `rebuilt:${currentCount}->${scraped.photocard_total}`
        } catch (e) {
          pcAction = `rebuild_err:${e.message}`
          row.notes.push(pcAction)
        }
      } else {
        pcAction = `skip_non_div13:${scraped.photocard_total}`
        row.notes.push(pcAction + `:${match.version_id}`)
      }
    } else if (!scraped.photocard_total) {
      pcAction = 'no_count_on_site'
    }

    console.log(`  [${so}] ${match.version_id} (${match.version_name}) -> ${pcAction}`)
    row.versions.push({
      sort_order: so,
      version_id: match.version_id,
      version_name: match.version_name,
      scraped_name: scraped.name,
      photocard_total: scraped.photocard_total,
      current_count: currentCount,
      action: pcAction,
    })
  }

  // Any unmatched baseDb versions keep their default 0 but we bump them so they
  // land after matched ones (still stable by version_id).
  let tailIdx = 1000
  for (const v of baseDb) {
    if (used.has(v.version_id)) continue
    await supabase.from('card_versions').update({ sort_order: tailIdx++ }).eq('version_id', v.version_id)
    console.log(`  [tail ${tailIdx - 1}] ${v.version_id} (${v.version_name}) kept (no scraped match)`)
    row.notes.push(`unmatched_db:${v.version_id}`)
  }
}

console.log('')
console.log('== Done ==')
console.log(JSON.stringify(report, null, 2))
