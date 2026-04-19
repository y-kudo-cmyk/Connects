import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
const { data: profile } = await s.from('profiles').select('id, role, nickname').eq('id', YUTA).maybeSingle()
console.log('YUTA profile:', profile)

const { data: admins } = await s.from('profiles').select('id, role, nickname').eq('role', 'admin')
console.log('\nall admins:')
for (const a of admins) console.log(a.id, '|', a.role, '|', a.nickname)
