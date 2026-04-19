import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

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

const report = JSON.parse(readFileSync(new URL('./scraped/store-benefits-report.json', import.meta.url), 'utf8'))

// Map report product_id (CSV-based) → DB product_id (by name match)
const { data: dbProducts } = await supabase.from('card_products').select('product_id, product_name, release_date')
function findDbId(reportPid, reportName) {
  // Try exact name match first
  const byName = dbProducts.find(p => p.product_name.toLowerCase() === reportName.toLowerCase())
  if (byName) return byName.product_id
  // Try fuzzy (includes unit prefix like "BSS - ")
  const byFuzzy = dbProducts.find(p => p.product_name.toLowerCase().includes(reportName.toLowerCase()) || reportName.toLowerCase().includes(p.product_name.toLowerCase().split(' - ').pop() || ''))
  return byFuzzy?.product_id
}

// Member IDs (after constants.ts fix: A000001=SCOUPS..A000013=DINO)
const ALL = Array.from({ length: 13 }, (_, i) => `A${String(i + 1).padStart(6, '0')}`)
const BSS  = ['A000005', 'A000010', 'A000011']  // HOSHI, DK, SEUNGKWAN
const JXW  = ['A000002', 'A000006']              // JEONGHAN, WONWOO
const HXW  = ['A000005', 'A000007']              // HOSHI, WOOZI
const DXS  = ['A000010', 'A000011']              // DK, SEUNGKWAN
const CXM  = ['A000001', 'A000009']              // SCOUPS, MINGYU (best guess — may need correction)

function groupMembers(productName) {
  const n = productName.toLowerCase()
  if (n.includes('bss') || n.includes('second wind') || n.includes('teleparty')) return BSS
  if (n.includes('jeonghan x wonwoo') || n.includes('jxw') || n.includes('this man')) return JXW
  if (n.includes('hoshi x woozi') || n.includes('hxw') || n.includes('beam')) return HXW
  if (n.includes('dxs') || n.includes('serenade')) return DXS
  if (n.includes('cxm') || n.includes('hype vibes')) return CXM
  return ALL
}

function memberFor(count, group) {
  // Distribute `count` cards across group members (cycle if count > group.length)
  const out = []
  for (let i = 0; i < count; i++) out.push(group[i % group.length])
  return out
}

const MEMBER_NAMES = {
  'A000001': 'S.COUPS', 'A000002': 'JEONGHAN', 'A000003': 'JOSHUA', 'A000004': 'JUN',
  'A000005': 'HOSHI',   'A000006': 'WONWOO',   'A000007': 'WOOZI',  'A000008': 'THE 8',
  'A000009': 'MINGYU',  'A000010': 'DK',       'A000011': 'SEUNGKWAN', 'A000012': 'VERNON', 'A000013': 'DINO',
}

function storeKey(storeName) {
  const s = storeName.toLowerCase()
  if (s.includes('weverse')) return 'WEVERSE'
  if (s.includes('universal') || s.includes('ums')) return 'UMS'
  if (s.includes('hmv') || s.includes('loppi')) return 'HMV'
  if (s.includes('tower')) return 'TOWER'
  if (s.includes('tsutaya')) return 'TSUTAYA'
  if (s.includes('amazon')) return 'AMAZON'
  if (s.includes('rakuten')) return 'RAKUTEN'
  return 'OTHER'
}

let totalVersions = 0, totalCards = 0, skipped = 0
for (const alb of report.albums) {
  const benefits = alb.store_benefits || []
  if (benefits.length === 0) continue

  const dbPid = findDbId(alb.db_product_id, alb.db_product_name)
  if (!dbPid) {
    console.log(`SKIP: ${alb.db_product_id} ${alb.db_product_name} — not found in DB`)
    skipped++
    continue
  }

  const dbRow = dbProducts.find(p => p.product_id === dbPid)
  const group = groupMembers(dbRow.product_name)

  console.log(`\n${dbPid} | ${dbRow.product_name} (group size=${group.length})`)

  const versionsBatch = []
  const cardsBatch = []

  for (const b of benefits) {
    const applies = (b.applies_to || []).join('/').slice(0, 40) || 'all'
    const key = storeKey(b.store)
    const vid = `V_${dbPid.replace('P_', '')}_BEN_${key}_${applies.replace(/[^\w]/g, '').slice(0, 20)}`
    const vname = `${applies} - ${b.store}`

    versionsBatch.push({
      version_id: vid,
      product_id: dbPid,
      version_name: vname,
    })

    const mems = memberFor(b.count || 1, group)
    mems.forEach((memId, i) => {
      cardsBatch.push({
        id: `CM_${dbPid.replace('P_', '')}_BEN_${key}_${applies.replace(/[^\w]/g, '').slice(0, 15)}_${i + 1}`,
        product_id: dbPid,
        version_id: vid,
        member_id: memId,
        member_name: MEMBER_NAMES[memId] || '',
        card_type: 'photocard',
        card_detail: `${b.benefit} ${i + 1}`,
        front_image_url: '',
        back_image_url: b.image || '',
      })
    })
  }

  const { error: vErr } = await supabase.from('card_versions').upsert(versionsBatch, { onConflict: 'version_id' })
  if (vErr) { console.log(`  versions ERR: ${vErr.message}`); continue }
  totalVersions += versionsBatch.length

  // Insert cards in chunks
  const CHUNK = 100
  for (let i = 0; i < cardsBatch.length; i += CHUNK) {
    const { error: cErr } = await supabase.from('card_master').upsert(cardsBatch.slice(i, i + CHUNK), { onConflict: 'id' })
    if (cErr) { console.log(`  cards ERR: ${cErr.message}`); break }
  }
  totalCards += cardsBatch.length
  console.log(`  versions=${versionsBatch.length}, cards=${cardsBatch.length}`)
}

console.log('')
console.log(`== SUMMARY ==`)
console.log(`Total versions upserted: ${totalVersions}`)
console.log(`Total cards upserted:    ${totalCards}`)
console.log(`Albums skipped:          ${skipped}`)
