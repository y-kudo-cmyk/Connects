// Investigation script: dump current card_versions and card_master for all 7 target albums.
// Read-only; used to plan additive seed scripts.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const TARGETS = ['P_JP002', 'P_JP003', 'P_JP004', 'P_JP005', 'P_JP008', 'P_JP010', 'P_JP011']

for (const PID of TARGETS) {
  const { data: prod } = await s.from('card_products').select('*').eq('product_id', PID).maybeSingle()
  console.log(`\n================ ${PID} ${prod?.product_name ?? '(no product)'} ================`)
  if (!prod) continue
  console.log(`release=${prod.release_date?.slice(0,10)} region=${prod.region} type=${prod.product_type}`)

  const { data: vers } = await s
    .from('card_versions')
    .select('*')
    .eq('product_id', PID)
    .order('tier', { ascending: true, nullsFirst: true })
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('version_id')
  console.log(`-- card_versions (${vers?.length ?? 0})`)
  for (const v of vers ?? []) {
    console.log(`  ${v.version_id} | tier=${v.tier ?? '-'} | sort=${v.sort_order ?? '-'} | ${v.version_name}`)
  }

  const { data: cards } = await s
    .from('card_master')
    .select('id, version_id, member_id, member_name, card_type, card_detail')
    .eq('product_id', PID)
  const byVer = new Map()
  for (const c of cards ?? []) {
    if (!byVer.has(c.version_id)) byVer.set(c.version_id, [])
    byVer.get(c.version_id).push(c)
  }
  console.log(`-- card_master (${cards?.length ?? 0} total)`)
  for (const [vid, list] of byVer) {
    const detailSet = new Set(list.map(c => c.card_detail ?? '(null)'))
    const typeSet = new Set(list.map(c => c.card_type ?? '(null)'))
    const memberSet = new Set(list.map(c => c.member_id))
    console.log(`  ${vid}: ${list.length} rows, ${memberSet.size} members, types={${[...typeSet].join(',')}} details={${[...detailSet].join(' | ')}}`)
  }

  const { count: ucCount } = await s
    .from('user_cards')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', PID)
  console.log(`-- user_cards: ${ucCount ?? 0}`)
}
