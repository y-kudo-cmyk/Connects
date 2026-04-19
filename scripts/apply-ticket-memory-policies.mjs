import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const sql = readFileSync(new URL('./ticket-memory-bucket-policies.sql', import.meta.url), 'utf8')
// try via rpc exec_sql or similar; fall back to direct PG via pg-native? No — use REST with service role: not supported.
// Print SQL for manual execution if rpc not available
const { error } = await s.rpc('exec_sql', { sql }).catch(() => ({ error: null }))
if (error) console.error('rpc:', error)
console.log('\n===== SQL (run in Supabase SQL editor if rpc failed) =====\n')
console.log(sql)
