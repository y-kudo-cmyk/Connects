import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Try a few name patterns
const patterns = ['%17 IS RIGHT HERE%', '%RIGHT HERE%', '%IS RIGHT HERE%']
for (const p of patterns) {
  const { data, error } = await s
    .from('card_products')
    .select('product_id, product_name, region, release_date, group_name')
    .ilike('product_name', p)
  console.log(`\nPattern ${p}: ${data?.length ?? 0} matches` + (error ? ` (error ${error.message})` : ''))
  for (const r of data ?? []) {
    console.log(`  ${r.product_id} | region=${r.region} | group=${r.group_name} | release=${r.release_date} | ${r.product_name}`)
  }
}

// list all products with 'BEST' too, as fallback
const { data: bestData } = await s
  .from('card_products')
  .select('product_id, product_name, region, release_date')
  .ilike('product_name', '%BEST%')
console.log(`\nBEST products: ${bestData?.length ?? 0}`)
for (const r of bestData ?? []) {
  console.log(`  ${r.product_id} | region=${r.region} | release=${r.release_date} | ${r.product_name}`)
}
