import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await s.from('card_versions').select('version_id, version_name, tier').eq('product_id', 'P_KR023').order('version_id')
for (const v of data || []) {
  console.log(`${v.tier?.padEnd(12) || 'NULL        '} | ${v.version_id.padEnd(45)} | ${v.version_name}`)
}
