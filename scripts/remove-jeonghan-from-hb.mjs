import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { count: before } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('product_id', 'P_KR023')
console.log(`HB cards before: ${before}`)

const { count: jhBefore } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('product_id', 'P_KR023').eq('member_id', 'A000002')
console.log(`JEONGHAN cards in HB: ${jhBefore}`)

// Also remove JEONGHAN user_cards references if any
await s.from('user_cards').delete().eq('product_id', 'P_KR023').eq('member_id', 'A000002')

const { error, count } = await s.from('card_master').delete({ count: 'exact' }).eq('product_id', 'P_KR023').eq('member_id', 'A000002')
if (error) { console.error(error); process.exit(1) }
console.log(`Deleted ${count} JEONGHAN cards from HB`)

const { count: after } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('product_id', 'P_KR023')
console.log(`HB cards after: ${after}`)
