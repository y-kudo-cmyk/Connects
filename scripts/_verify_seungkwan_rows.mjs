import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Confirm SEUNGKWAN rows exist for HEAVEN
for (const v of ['V_KR019_01', 'V_KR019_02', 'V_KR019_03']) {
  const { data } = await s.from('card_master').select('id, card_type, card_detail, member_id, member_name').eq('version_id', v).eq('member_id', 'A000011').order('id')
  console.log(`\n${v} SEUNGKWAN: ${data.length} rows`)
  for (const c of data) console.log(`  ${c.id} | type=${c.card_type} | detail=${c.card_detail} | member_name=${c.member_name}`)
}

// Also VERNON for compare
for (const v of ['V_KR019_01']) {
  const { data } = await s.from('card_master').select('id, card_type, card_detail, member_id, member_name').eq('version_id', v).eq('member_id', 'A000012').order('id')
  console.log(`\n${v} VERNON: ${data.length} rows`)
  for (const c of data) console.log(`  ${c.id} | type=${c.card_type} | detail=${c.card_detail} | member_name=${c.member_name}`)
}
