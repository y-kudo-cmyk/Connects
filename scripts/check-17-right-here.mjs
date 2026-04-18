import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: prods } = await s.from('card_products').select('*').or('product_name.ilike.%RIGHT HERE%,product_name.ilike.%17 IS%')
console.log(`matching products: ${prods?.length || 0}`)
for (const p of prods || []) console.log(`  ${p.product_id} | region=${p.region} | release=${p.release_date} | ${p.product_name}`)

for (const p of prods || []) {
  const { data: versions } = await s.from('card_versions').select('version_id, version_name, tier, sort_order').eq('product_id', p.product_id).order('sort_order').order('version_id')
  console.log(`\n== ${p.product_id} versions: ${versions.length} ==`)
  for (const v of versions) {
    const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.version_id)
    console.log(`  ${v.version_id} | tier=${v.tier} | sort=${v.sort_order} | ${v.version_name} | cards=${count}`)
  }
}
