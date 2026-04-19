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

const DIGITAL_IDS = ['P_UN002']

async function check(label, tbl, col = 'product_id') {
  const { data, error, count } = await supabase
    .from(tbl)
    .select('*', { count: 'exact' })
    .in(col, DIGITAL_IDS)
  if (error) throw new Error(`${label}: ${error.message}`)
  console.log(`  ${tbl}.${col} in [${DIGITAL_IDS.join(',')}] -> ${count ?? data?.length ?? 0} rows`)
  return data || []
}

console.log('== Dependency check ==')
const userCards = await check('user_cards', 'user_cards')
const cardMaster = await check('card_master', 'card_master')
const cardVersions = await check('card_versions', 'card_versions')

console.log('')
console.log('== Deleting digital products (cascade manually) ==')

if (userCards.length) {
  const { error } = await supabase.from('user_cards').delete().in('product_id', DIGITAL_IDS)
  if (error) throw new Error(`user_cards delete: ${error.message}`)
  console.log(`  user_cards: deleted ${userCards.length} rows`)
}
if (cardMaster.length) {
  const { error } = await supabase.from('card_master').delete().in('product_id', DIGITAL_IDS)
  if (error) throw new Error(`card_master delete: ${error.message}`)
  console.log(`  card_master: deleted ${cardMaster.length} rows`)
}
if (cardVersions.length) {
  const { error } = await supabase.from('card_versions').delete().in('product_id', DIGITAL_IDS)
  if (error) throw new Error(`card_versions delete: ${error.message}`)
  console.log(`  card_versions: deleted ${cardVersions.length} rows`)
}

const { error: delErr, count: delCount } = await supabase
  .from('card_products')
  .delete({ count: 'exact' })
  .in('product_id', DIGITAL_IDS)
if (delErr) throw new Error(`card_products delete: ${delErr.message}`)
console.log(`  card_products: deleted ${delCount} rows`)

console.log('')
console.log('== Remaining products count ==')
const { count: after } = await supabase
  .from('card_products')
  .select('*', { count: 'exact', head: true })
console.log(`  card_products now has ${after} rows`)
