import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'

const { data: all } = await s.from('user_cards').select('id, card_master_id, product_id, version_id, member_id, quantity, front_image_url, created_at, status').eq('user_id', YUTA).eq('status', 'ACTIVE').order('created_at', { ascending: false })
console.log(`YUTA user_cards ACTIVE: ${all.length}`)

const byDate = new Map()
for (const c of all) {
  const d = (c.created_at || '').slice(0,10)
  byDate.set(d, (byDate.get(d) || 0) + 1)
}
console.log('\nby date:')
for (const [d, n] of [...byDate.entries()].sort()) console.log(`  ${d}: ${n}`)

const yesterday = all.filter(c => (c.created_at || '').startsWith('2026-04-18'))
console.log(`\n2026-04-18 registered: ${yesterday.length}`)

// product breakdown
const pc = new Map()
for (const c of yesterday) pc.set(c.product_id, (pc.get(c.product_id) || 0) + 1)
for (const [p, n] of [...pc.entries()].sort((a,b)=>b[1]-a[1])) {
  const { data: prod } = await s.from('card_products').select('product_name').eq('product_id', p).maybeSingle()
  console.log(`  ${p} (${prod?.product_name}): ${n}`)
}

// sample
console.log('\nsample 5:')
for (const c of yesterday.slice(0,5)) console.log(`  ${c.created_at.slice(11,19)} | ${c.product_id} | ${c.version_id} | ${c.member_id} | qty=${c.quantity}`)
