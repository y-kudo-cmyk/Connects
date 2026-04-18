import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

for (const pid of ['P_KR003', 'P_KR004']) {
  const { data: p } = await s.from('card_products').select('product_name, release_date').eq('product_id', pid).maybeSingle()
  const { data: versions } = await s.from('card_versions').select('version_id, version_name, tier, sort_order').eq('product_id', pid).order('sort_order').order('version_id')
  console.log(`\n== ${pid} ${p?.product_name} (${p?.release_date}) ==`)
  for (const v of versions) {
    const { data: cards } = await s.from('card_master').select('id, member_id, card_detail, card_type').eq('version_id', v.version_id).order('member_id')
    const memberList = [...new Set(cards.map(c => c.member_id))].length
    console.log(`  ${v.version_id} | tier=${v.tier} | ${v.version_name} | cards=${cards.length} / members=${memberList}`)
    // sample 2 cards
    for (const c of cards.slice(0, 3)) console.log(`    ${c.member_id} | ${c.card_detail || '-'} | ${c.card_type}`)
  }
}
