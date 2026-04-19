import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const email = 'kurumi_0224_kurukuru@icloud.com'
const lineId = 'U7271f12661b5c34f9c7eef2b7c5083b5'

// glide_users
const { data: gu } = await s.from('glide_users').select('*').or(`mail.eq.${email},line_user_id.eq.${lineId}`)
console.log('glide_users:')
for (const g of gu || []) console.log(JSON.stringify(g, null, 2))

// profiles
const { data: pr } = await s.from('profiles').select('id, mail, nickname, membership_number, line_user_id, role').or(`mail.eq.${email},line_user_id.eq.${lineId}`)
console.log('\nprofiles:')
for (const p of pr || []) console.log(JSON.stringify(p, null, 2))
