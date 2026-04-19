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

const { data } = await supabase
  .from('profiles')
  .select('id, mail, nickname, role')
  .or('mail.ilike.%yuta%,mail.ilike.%y-kudo%,id.eq.86c91b90-0060-4a3d-bf10-d5c846604882,id.eq.65ba4bc6-917d-4689-aeaf-8d4b5b01a004')

for (const r of data || []) {
  console.log(`${r.id} | ${r.mail?.padEnd(35)} | nickname="${r.nickname}" | role=${r.role}`)
}

console.log('')
console.log('== All admins ==')
const { data: admins } = await supabase
  .from('profiles')
  .select('id, mail, nickname, role')
  .eq('role', 'admin')
for (const r of admins || []) {
  console.log(`${r.id} | ${r.mail?.padEnd(35)} | nickname="${r.nickname}"`)
}
