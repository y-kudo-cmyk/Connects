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
  .select('id, mail, nickname, role, created_at')
  .or('mail.ilike.%y-kudo%,mail.ilike.%ykudo%,mail.ilike.%kudo%,nickname.ilike.%kudo%,nickname.ilike.%yuta%')
  .order('created_at', { ascending: false })

console.log(`Hit: ${data?.length ?? 0}`)
for (const r of data || []) {
  console.log(`${r.id} | ${r.mail} | nickname="${r.nickname}" | role=${r.role} | ${r.created_at?.slice(0,10)}`)
}
