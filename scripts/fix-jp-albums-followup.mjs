import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ALL_13 = ['A000001','A000002','A000003','A000004','A000005','A000006','A000007','A000008','A000009','A000010','A000011','A000012','A000013']
const NO_SCOUPS = ALL_13.filter((x) => x !== 'A000002')

// 1) Delete duplicate 限定C empty rows
for (const dupVid of ['V_JP005_03', 'V_JP008_03']) {
  const { data: existing } = await s.from('card_master').select('id').eq('version_id', dupVid)
  if (existing?.length) await s.from('card_master').delete().eq('version_id', dupVid)
  await s.from('card_versions').delete().eq('version_id', dupVid)
  console.log(`deleted duplicate version ${dupVid}`)
}

// 2) Backfill empty card_master for all JP versions with 0 cards
const { data: jpProducts } = await s.from('card_products').select('product_id, release_date').ilike('product_id', 'P_JP%')
const productReleaseMap = new Map(jpProducts.map((p) => [p.product_id, p.release_date]))

const { data: allJpVersions } = await s.from('card_versions').select('version_id, product_id').in('product_id', jpProducts.map((p) => p.product_id))

let created = 0
for (const v of allJpVersions) {
  const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.version_id)
  if ((count ?? 0) > 0) continue

  const release = productReleaseMap.get(v.product_id)
  const members = release && release >= '2024-03-11' ? NO_SCOUPS : ALL_13

  const rows = members.map((memberId) => ({
    id: `C_${v.product_id}_${v.version_id.slice(-2)}_${memberId}`,
    product_id: v.product_id,
    version_id: v.version_id,
    member_id: memberId,
    card_type: 'photocard',
    card_detail: null,
    front_image_url: null,
    back_image_url: null,
  }))
  const { error } = await s.from('card_master').upsert(rows, { onConflict: 'id' })
  if (error) console.error(`${v.version_id}:`, error.message)
  else { created += rows.length; console.log(`${v.version_id}: +${rows.length} cards`) }
}

console.log(`\ntotal cards created: ${created}`)

// 3) Verification
const { data: verify } = await s.from('card_versions').select('product_id, version_id, version_name').in('product_id', jpProducts.map((p) => p.product_id)).order('product_id').order('version_id')
let emptyCount = 0
for (const v of verify) {
  const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.version_id)
  if (count === 0) { console.log(`STILL EMPTY: ${v.product_id} ${v.version_id} ${v.version_name}`); emptyCount++ }
}
console.log(`\nJP versions total: ${verify.length}, empty: ${emptyCount}`)

const { count: totalCards } = await s.from('card_master').select('*', { count: 'exact', head: true }).in('product_id', jpProducts.map((p) => p.product_id))
console.log(`JP card_master total: ${totalCards}`)
