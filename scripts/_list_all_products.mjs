import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: prods } = await s.from('card_products').select('product_id, product_name, product_type, region, release_date').order('release_date', { ascending: false })
console.log(`products: ${prods.length}\n`)
for (const p of prods) {
  const { data: included } = await s.from('card_versions').select('version_id, version_name, tier').eq('product_id', p.product_id).or('tier.eq.INCLUDED,tier.is.null')
  console.log(`${p.product_id} | ${p.release_date?.slice(0,10)} | ${p.region} | ${p.product_type} | ${p.product_name}`)
  for (const v of included || []) {
    // Count cards per member, show card_type distribution
    const { data: cards } = await s.from('card_master').select('card_type, member_id').eq('version_id', v.version_id)
    const types = new Map()
    const perMember = new Map()
    for (const c of cards || []) {
      types.set(c.card_type, (types.get(c.card_type) || 0) + 1)
      if (!perMember.has(c.member_id)) perMember.set(c.member_id, new Map())
      const mt = perMember.get(c.member_id)
      mt.set(c.card_type, (mt.get(c.card_type) || 0) + 1)
    }
    // Pick first member to show structure
    const firstMember = perMember.values().next().value
    const perMemberStr = firstMember ? [...firstMember.entries()].map(([t,n])=>`${t}×${n}`).join(',') : '(no cards)'
    console.log(`   ${v.version_id} ${v.version_name || ''} | per-member: ${perMemberStr} | total ${cards?.length || 0}`)
  }
  console.log()
}
