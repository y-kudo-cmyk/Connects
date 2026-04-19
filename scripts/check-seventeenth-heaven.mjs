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

const { data } = await supabase
  .from('card_products')
  .select('product_id, product_name, image_url')
  .or('product_name.ilike.%SEVENTEENTH%,product_name.ilike.%FML%,product_name.ilike.%Sector%,product_name.ilike.%Face%')

for (const r of data || []) {
  console.log(`${r.product_id} | ${r.product_name}`)
  console.log(`  ${r.image_url || '(empty)'}`)
}
