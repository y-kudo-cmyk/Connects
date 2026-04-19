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
  .order('release_date', { ascending: false })

for (const p of products || []) {
  const { count } = await supabase
    .from('card_master')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', p.product_id)
  const { data: sample } = await supabase
    .from('card_master')
    .select('member_id, member_name')
    .eq('product_id', p.product_id)
    .limit(1)
  const memInfo = sample && sample[0] ? `has_member=${!!sample[0].member_id}` : 'no-sample'
  console.log(`${p.product_id} | cards=${String(count).padStart(4)} | ${memInfo} | ${p.product_name}`)
}
