import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: vers } = await s.from('card_versions').select('*').eq('product_id', 'P_JP010').order('sort_order')
console.log('P_JP010 消費期限 versions:')
for (const v of vers) console.log(`  ${v.version_id} | ${v.version_name} | tier=${v.tier} | sort=${v.sort_order}`)

for (const v of vers) {
  const { data } = await s.from('card_master').select('id, member_id, member_name, card_type, card_detail').eq('version_id', v.version_id).order('id')
  console.log(`\n${v.version_id} cards: ${data.length}`)
  for (const c of data) console.log(`  ${c.id} | ${c.member_id} ${c.member_name} | ${c.card_type} | ${c.card_detail}`)
}
