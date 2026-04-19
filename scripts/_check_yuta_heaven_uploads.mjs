import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
// HEAVEN registered user_cards in last 2 hours
const { data } = await s.from('user_cards').select('id, card_master_id, product_id, version_id, member_id, member_name, quantity, front_image_url, wanted_count, created_at').eq('user_id', YUTA).eq('product_id', 'P_KR019').eq('status', 'ACTIVE').order('created_at', { ascending: false }).limit(30)
console.log(`YUTA HEAVEN user_cards: ${data.length}`)
for (const c of data) {
  const hasImg = c.front_image_url ? '✓' : '—'
  console.log(`  ${c.created_at.slice(11,19)} | ${c.version_id} | ${c.member_id} ${c.member_name} | qty=${c.quantity} want=${c.wanted_count ?? '—'} | img:${hasImg} | cm=${c.card_master_id}`)
}
