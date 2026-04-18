import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// HERE (26 cards) - dump
for (const vid of ['V_KR021_01', 'V_KR021_02']) {
  const { data: cards } = await s.from('card_master').select('id, member_id, card_detail, card_type').eq('version_id', vid).order('member_id').order('id')
  console.log(`\n== ${vid} cards: ${cards.length} ==`)
  for (const c of cards) console.log(`  ${c.id} | ${c.member_id} | detail="${c.card_detail}"`)
}
