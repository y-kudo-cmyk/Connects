import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: versions } = await s.from('card_versions').select('version_id, version_name, tier, sort_order').eq('product_id', 'P_KR023').eq('tier', 'STORE_JP').order('version_id')

for (const v of versions) {
  let order = 99
  if (v.version_name.startsWith('通常版')) order = 0
  else if (v.version_name.startsWith('DAREDEVIL')) order = 1
  else if (v.version_name.startsWith('ラキドロ')) order = 2
  await s.from('card_versions').update({ sort_order: order }).eq('version_id', v.version_id)
  console.log(`${order} | ${v.version_name}`)
}
