import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// search profiles by mail
const { data: pr1 } = await s.from('profiles').select('id, mail, nickname, membership_number, line_user_id, role').ilike('mail', '%yuta129%')
console.log('profiles matching yuta129:', pr1)

// glide_users
const { data: gu } = await s.from('glide_users').select('mail, membership_number, line_user_id, migrated').eq('mail', 'yuta129@gmail.com').maybeSingle()
console.log('glide_users:', gu)

// profile with nickname yyyyy (U000002)
const { data: pU2 } = await s.from('profiles').select('id, mail, nickname, membership_number').eq('membership_number', 'U000002').maybeSingle()
console.log('\nprofile U000002:', pU2)

// all profiles
const { data: all } = await s.from('profiles').select('id, mail, nickname, membership_number').order('membership_number').limit(20)
console.log('\nfirst 20 profiles:')
for (const p of all) console.log(`  ${p.membership_number} | ${p.mail} | ${p.nickname} | ${p.id.slice(0,8)}`)
