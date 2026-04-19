import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data, error } = await s.rpc('pg_policies_on_table', { tname: 'profiles' }).catch(() => ({ data: null, error: null }))
// fallback: raw select from pg_policies
const { data: pol, error: e2 } = await s.from('pg_policies').select('*').eq('tablename', 'profiles')
if (e2) console.log('e2:', e2)
console.log('policies:', pol)
