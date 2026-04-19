import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// search glide_users by line_user_id
const { data } = await s.from('glide_users').select('*').eq('line_user_id', 'Ub88e74f829aeecc9d5fa1cfee7161199')
console.log('glide_users:', data)

// cols
const { data: sample } = await s.from('glide_users').select('*').limit(1)
console.log('cols:', sample?.[0] ? Object.keys(sample[0]) : 'empty')

// total
const { count } = await s.from('glide_users').select('*', { count: 'exact', head: true })
console.log('total glide_users:', count)

// profile by membership_number U000001 / U000002
for (const num of ['U000001', 'U000002']) {
  const { data } = await s.from('profiles').select('id, membership_number, nickname, line_user_id').eq('membership_number', num).maybeSingle()
  console.log(`profile ${num}:`, data)
}
