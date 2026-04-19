import 'dotenv/config'
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

const { data, error } = await supabase
  .from('card_products')
  .select('product_id, product_name, product_type, region, release_date, artist_id')
  .order('release_date', { ascending: true })

if (error) {
  console.error('ERROR:', error)
  process.exit(1)
}

console.log(`Total products: ${data.length}`)
console.log('')
console.log('product_id | release_date | type | region | artist_id | name')
console.log('-'.repeat(100))
for (const row of data) {
  console.log(
    `${row.product_id} | ${row.release_date || '----------'} | ${row.product_type || '-'} | ${row.region || '-'} | ${row.artist_id || '-'} | ${row.product_name}`
  )
}

const DIGITAL_KEYWORDS = ['ruby', 'what kind of future', 'layover', 'black eye', 'wait', 'mixtape', 'digital']
const suspects = data.filter(r => {
  const name = (r.product_name || '').toLowerCase()
  const type = (r.product_type || '').toLowerCase()
  return type.includes('digital') || DIGITAL_KEYWORDS.some(k => name.includes(k))
})

console.log('')
console.log(`Digital suspects: ${suspects.length}`)
for (const s of suspects) {
  console.log(`  - ${s.product_id} [${s.product_type}] ${s.product_name} (${s.release_date})`)
}
