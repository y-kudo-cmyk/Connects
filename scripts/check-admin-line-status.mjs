import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data } = await s.from('profiles').select('id, mail, nickname, role, line_user_id').eq('role', 'admin')
for (const p of data || []) {
  const linked = p.line_user_id ? `LINE=${p.line_user_id.slice(0,10)}...` : 'LINE未連携'
  console.log(`${p.mail.padEnd(35)} | ${p.nickname.padEnd(15)} | ${linked}`)
}
