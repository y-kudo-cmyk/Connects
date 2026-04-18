import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: matches } = await s.from('spots').select('id, spot_name, memo, source_url').ilike('spot_name', '%스시한판%스타필드%')
console.log(`matches: ${matches.length}`)
for (const sp of matches) console.log(`  ${sp.id} | ${sp.spot_name} | memo="${sp.memo}" | src=${sp.source_url}`)

for (const sp of matches) {
  await s.from('spots').update({ memo: '' }).eq('id', sp.id)
  console.log(`cleared ${sp.id}`)
}
