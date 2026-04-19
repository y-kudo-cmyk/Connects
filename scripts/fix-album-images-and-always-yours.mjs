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

// 1. Fix image URLs (from seventeen-17.jp raw HTML)
const IMAGE_FIXES = [
  { product_id: 'P_KR019', name: 'SEVENTEENTH HEAVEN', url: 'https://s3-ap-northeast-1.amazonaws.com/pf-web/fanclubs/15/posts/77400/wpf5mnfj8c.jpg' },
  { product_id: 'P_KR017', name: 'Sector 17',          url: 'https://s3-ap-northeast-1.amazonaws.com/pf-web/fanclubs/15/posts/57339/1ddtu7qwyz.jpg' },
]

for (const fix of IMAGE_FIXES) {
  const { error } = await supabase
    .from('card_products')
    .update({ image_url: fix.url })
    .eq('product_id', fix.product_id)
  if (error) console.log(`  ${fix.product_id} ERR:`, error.message)
  else console.log(`  ${fix.product_id} ${fix.name}: image_url updated`)
}

// 2. Delete P_KR020 (Always Yours KR duplicate — keep P_JP011 as JP release)
console.log('')
console.log('== Always Yours dedupe ==')
const { data: before } = await supabase
  .from('card_products')
  .select('product_id, product_name, region, release_date')
  .or('product_id.eq.P_KR020,product_id.eq.P_JP011')
for (const r of before || []) console.log(`  ${r.product_id} | ${r.region} | ${r.product_name} (${r.release_date})`)

// dependency cleanup
for (const tbl of ['user_cards', 'card_master', 'card_versions']) {
  const { count } = await supabase.from(tbl).select('*', { count: 'exact', head: true }).eq('product_id', 'P_KR020')
  if (count && count > 0) {
    const { error } = await supabase.from(tbl).delete().eq('product_id', 'P_KR020')
    if (error) console.log(`  ${tbl} delete ERR:`, error.message)
    else console.log(`  ${tbl}: deleted ${count} rows referencing P_KR020`)
  }
}

const { error: delErr, count: delCount } = await supabase
  .from('card_products')
  .delete({ count: 'exact' })
  .eq('product_id', 'P_KR020')
if (delErr) console.log('  card_products delete ERR:', delErr.message)
else console.log(`  card_products: deleted ${delCount} rows (P_KR020)`)

// 3. Final check
console.log('')
console.log('== After fixes ==')
const { data: after } = await supabase
  .from('card_products')
  .select('product_id, product_name, region, image_url')
  .or('product_id.eq.P_KR017,product_id.eq.P_KR019,product_id.eq.P_KR020,product_id.eq.P_JP011')
  .order('product_id')
for (const r of after || []) {
  console.log(`${r.product_id} | ${r.region} | ${r.product_name}`)
  console.log(`  ${r.image_url}`)
}
