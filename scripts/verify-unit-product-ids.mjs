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

const { data: products } = await supabase
  .from('card_products')
  .select('product_id, product_name, release_date')
  .like('product_id', 'P_UN%')
  .order('product_id')

for (const p of products || []) {
  const { count: vCnt } = await supabase.from('card_versions').select('*', { count: 'exact', head: true }).eq('product_id', p.product_id)
  const { count: cCnt } = await supabase.from('card_master').select('*', { count: 'exact', head: true }).eq('product_id', p.product_id)
  console.log(`${p.product_id} | ${p.release_date} | ${p.product_name} | versions=${vCnt} cards=${cCnt}`)
}
