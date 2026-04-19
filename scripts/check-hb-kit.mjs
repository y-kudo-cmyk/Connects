import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: products } = await s.from('card_products').select('product_id, product_name').ilike('product_name', '%HAPPY%BURSTDAY%')
console.log('HAPPY BURSTDAY products:')
for (const p of products) console.log(`  ${p.product_id} | ${p.product_name}`)

if (products?.length) {
  const pid = products[0].product_id
  const { data: versions } = await s.from('card_versions').select('version_id, version_name, tier, sort_order').eq('product_id', pid).order('sort_order')
  console.log(`\nversions:`)
  for (const v of versions) console.log(`  ${v.version_id} | tier=${v.tier} | sort=${v.sort_order} | ${v.version_name}`)

  const kit = versions.filter(v => /kit/i.test(v.version_name))
  for (const v of kit) {
    const { data: cards } = await s.from('card_master').select('id, member_id, card_detail, card_type, front_image_url').eq('version_id', v.version_id).limit(4)
    console.log(`\n  [${v.version_name}] cards:`)
    for (const c of cards) console.log(`    ${c.member_id} | detail="${c.card_detail}" type="${c.card_type}" img=${c.front_image_url ? 'yes' : 'no'}`)
  }
}
