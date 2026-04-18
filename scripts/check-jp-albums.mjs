import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: prods } = await s.from('card_products').select('product_id, product_name, region, release_date, group_name').order('release_date')
console.log(`total products: ${prods.length}\n`)

const jpProducts = prods.filter(p => p.region === 'JP' || p.product_id.startsWith('P_JP'))
console.log(`JP products: ${jpProducts.length}`)
for (const p of jpProducts) console.log(`  ${p.product_id} | region=${p.region} | release=${p.release_date} | ${p.product_name}`)

const krProducts = prods.filter(p => p.region === 'KR' || p.product_id.startsWith('P_KR'))
console.log(`\nKR products: ${krProducts.length}`)
for (const p of krProducts.slice(0,15)) console.log(`  ${p.product_id} | region=${p.region} | release=${p.release_date} | ${p.product_name}`)

// check if any JP albums have card_versions
if (jpProducts.length) {
  const { data: jpVersions } = await s.from('card_versions').select('version_id, product_id').in('product_id', jpProducts.map(p => p.product_id))
  console.log(`\nJP versions total: ${jpVersions.length}`)
  const byProduct = new Map()
  for (const v of jpVersions) byProduct.set(v.product_id, (byProduct.get(v.product_id) || 0) + 1)
  for (const [pid, count] of byProduct) console.log(`  ${pid}: ${count} versions`)
}
