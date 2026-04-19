import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: all } = await s.from('card_products').select('product_id, product_name, product_type, region, release_date').order('release_date')
console.log(`total: ${all.length}`)

const byType = new Map()
for (const p of all) byType.set(p.product_type || '(null)', (byType.get(p.product_type || '(null)') || 0) + 1)
console.log('\nby product_type:')
for (const [k, v] of [...byType.entries()].sort((a,b)=>b[1]-a[1])) console.log(`  ${k}: ${v}`)

// search for digital
const { data: dig } = await s.from('card_products').select('*').or('product_type.ilike.%digital%,product_name.ilike.%digital%')
console.log(`\ndigital matches: ${dig?.length || 0}`)
for (const p of dig || []) console.log(`  ${p.product_id} | type=${p.product_type} | ${p.product_name}`)
