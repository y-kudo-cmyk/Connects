// Dumps card_products / card_versions and (optionally) BENEFIT_/LUCKY_ card_master
// rows to a JSON file so the scrape-vs-DB comparison can read it without needing
// a live Supabase connection during the comparison step. Safe: read-only.
//
// Run manually:
//   node scripts/scraped/_db_dump.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const { data: products, error: pErr } = await supabase
  .from('card_products')
  .select('product_id, product_name, product_type, region, release_date, artist_id')
  .order('release_date', { ascending: true })
if (pErr) { console.error(pErr); process.exit(1) }

const { data: versions, error: vErr } = await supabase
  .from('card_versions')
  .select('version_id, product_id, version_name')
if (vErr) { console.error(vErr); process.exit(1) }

const { data: benefits, error: bErr } = await supabase
  .from('card_master')
  .select('id, product_id, version_id, member_name, card_type, card_detail, back_image_url')
  .or('version_id.ilike.%BENEFIT%,version_id.ilike.%LUCKY%')
if (bErr) { console.error(bErr); process.exit(1) }

writeFileSync(
  new URL('./db_dump.json', import.meta.url),
  JSON.stringify({ products, versions, benefits, dumped_at: new Date().toISOString() }, null, 2)
)
console.log(`products=${products.length} versions=${versions.length} benefit_cards=${benefits.length}`)
