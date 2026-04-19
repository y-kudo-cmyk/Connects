import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// HAPPY BURSTDAY product id
const { data: p } = await s.from('card_products').select('product_id').ilike('product_name', '%HAPPY%BURSTDAY%')
const pid = p?.[0]?.product_id
console.log('product:', pid)

const { data: versions } = await s.from('card_versions').select('version_id, version_name, tier, sort_order').eq('product_id', pid).order('sort_order')
console.log('\nall versions:')
for (const v of versions) console.log(`  ${v.version_id} | tier=${v.tier} | sort=${v.sort_order} | ${v.version_name}`)
