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

// Get any HAPPY BURSTDAY card
const { data: cards } = await supabase
  .from('card_master')
  .select('id, product_id, version_id, member_id, member_name')
  .eq('product_id', 'P_KR023')
  .limit(1)

if (!cards || cards.length === 0) {
  console.log('No card_master rows found for P_KR023')
  process.exit(1)
}

const card = cards[0]
console.log('Using card:', card)

const YKUDO = '65ba4bc6-917d-4689-aeaf-8d4b5b01a004'
const testRow = {
  id: `CARD-TEST-${Date.now()}`,
  user_id: YKUDO,
  card_master_id: card.id,
  product_id: card.product_id,
  version_id: card.version_id,
  member_id: card.member_id,
  member_name: card.member_name,
  front_image_url: '',
  back_image_url: '',
  quantity: 1,
  notes: 'test insert via script',
  status: 'ACTIVE',
}
console.log('Test insert:', testRow)

const { data, error } = await supabase.from('user_cards').insert(testRow).select().single()
if (error) {
  console.error('Insert failed:', error)
  process.exit(1)
}
console.log('Inserted:', data.id)

// Cleanup
await supabase.from('user_cards').delete().eq('id', testRow.id)
console.log('Cleaned up test row')
