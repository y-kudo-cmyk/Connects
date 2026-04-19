import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

for (const v of ['V_KR019_01', 'V_KR019_02', 'V_KR019_03']) {
  const { data } = await s.from('card_master').select('id, member_id, card_detail').eq('version_id', v).order('id')
  console.log(`\n${v}: ${data.length} cards`)
  for (const c of data) console.log(`  ${c.id} | ${c.member_id} | ${c.card_detail}`)
}
