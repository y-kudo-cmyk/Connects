// 全コンサート製品の version tier を INCLUDED → VENUE に変更
// version_name も「会場トレカ」に統一
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: prods } = await s.from('card_products').select('product_id').like('product_id', 'P_CON_%')
console.log(`Concert products: ${prods.length}`)

for (const p of prods) {
  const { error } = await s.from('card_versions')
    .update({ tier: 'VENUE', version_name: '会場トレカ' })
    .eq('product_id', p.product_id)
  if (error) console.error(`  ${p.product_id} err: ${error.message}`)
  else console.log(`✓ ${p.product_id}`)
}
