import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: before } = await s.from('profiles').select('id, mail, nickname, role').eq('mail', 'hakuren.x1215@gmail.com').single()
if (!before) { console.error('User not found'); process.exit(1) }
console.log('Before:', before)

const { data, error } = await s.from('profiles').update({ role: 'admin' }).eq('id', before.id).select().single()
if (error) { console.error(error); process.exit(1) }
console.log('After :', { id: data.id, mail: data.mail, nickname: data.nickname, role: data.role })
