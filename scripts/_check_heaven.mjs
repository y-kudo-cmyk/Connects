import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: products } = await s.from('card_products').select('product_id, product_name, region').ilike('product_name', '%HEAVEN%')
console.log('products:', products)

for (const p of products || []) {
  const { data: vers } = await s.from('card_versions').select('version_id, version_name, tier, sort_order').eq('product_id', p.product_id).order('sort_order')
  console.log(`\n== ${p.product_id} : ${p.product_name} ==`)
  for (const v of vers) console.log(`  ${v.version_id} | ${v.version_name} | tier=${v.tier} | sort=${v.sort_order}`)

  // 封入のカード枚数をメンバー毎にカウント
  const { data: cards } = await s.from('card_master').select('id, version_id, member_id, card_type, card_detail').eq('product_id', p.product_id)
  const included = (vers || []).filter(v => v.tier === 'INCLUDED' || (!v.tier && !/STORE|LUCKY|EVENT|VENUE|MERCH/i.test(v.version_id)))
  for (const v of included) {
    const byMember = new Map()
    for (const c of cards.filter(c => c.version_id === v.version_id)) {
      byMember.set(c.member_id, (byMember.get(c.member_id) || 0) + 1)
    }
    console.log(`  ${v.version_id} ${v.version_name}: members × cards`)
    for (const [m, n] of byMember.entries()) console.log(`    ${m}: ${n}`)
  }
}
