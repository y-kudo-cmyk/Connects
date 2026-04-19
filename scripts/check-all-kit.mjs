import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await s.from('card_versions').select('version_id, product_id, version_name, tier').ilike('version_name', '%KiT%')
// group by product
const byProduct = new Map()
for (const v of data) {
  if (!byProduct.has(v.product_id)) byProduct.set(v.product_id, [])
  byProduct.get(v.product_id).push(v)
}
for (const [pid, vs] of byProduct) {
  if (vs.length > 1) {
    const { data: p } = await s.from('card_products').select('product_name').eq('product_id', pid).maybeSingle()
    console.log(`\n${pid} | ${p?.product_name}`)
    for (const v of vs) console.log(`  ${v.version_id} | tier=${v.tier} | ${v.version_name}`)
  }
}
