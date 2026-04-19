import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const NAMES = ['S.COUPS', 'JEONGHAN', 'JOSHUA', 'JUN', 'HOSHI', 'WONWOO', 'WOOZI', 'THE 8', 'MINGYU', 'DK', 'SEUNGKWAN', 'VERNON', 'DINO']

const { data: prods } = await s.from('card_products').select('product_id, product_name').eq('region', 'UNIT').order('product_id')
for (const p of prods) {
  const { data: cards } = await s.from('card_master').select('member_id').eq('product_id', p.product_id)
  const memberSet = new Set(cards.map(c => c.member_id).filter(Boolean))
  const members = [...memberSet].sort().map(id => NAMES[parseInt(id.slice(1)) - 1]).join(', ')
  console.log(`${p.product_id} ${p.product_name}`)
  console.log(`  members in card_master: ${members || '(none)'}`)
  console.log(`  cards: ${cards.length}`)
  console.log()
}
