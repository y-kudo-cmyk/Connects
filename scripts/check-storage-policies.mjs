import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// List policies on storage.objects (use rpc if exists, else skip)
const sql = `select policyname, cmd, qual::text, with_check::text from pg_policies where schemaname='storage' and tablename='objects' order by policyname;`

try {
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  if (error) throw error
  console.log('Storage policies:')
  console.table(data)
} catch (e) {
  console.log('RPC not available (' + (e?.message || e) + ')')
  console.log('')
  console.log('Please run this in Supabase SQL Editor to see current policies:')
  console.log('')
  console.log(sql)
}
