import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Focus on INCLUDED versions, one member (S.COUPS = A000001) to see card_detail labels
const versions = ['V_KR019_01', 'V_KR019_02', 'V_KR019_03', 'V_KR019_04', 'V_KR019_07', 'V_KR019_08']
for (const v of versions) {
  const { data } = await s.from('card_master').select('id, member_id, card_type, card_detail').eq('version_id', v).eq('member_id', 'A000001')
  console.log(`\n${v} S.COUPS:`)
  for (const c of data) console.log(`  ${c.id} | type=${c.card_type} | detail=${c.card_detail}`)
}
