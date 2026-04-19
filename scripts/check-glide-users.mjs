import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { count: total, error } = await s.from('glide_users').select('*', { count: 'exact', head: true })
if (error) { console.log('glide_users table:', error.message); process.exit(0) }
console.log(`glide_users total: ${total}`)

const { data, count: withLine } = await s.from('glide_users').select('mail, line_user_id', { count: 'exact' }).not('line_user_id', 'is', null).limit(20)
console.log(`glide_users with line_user_id: ${withLine}`)
console.log('sample:', data?.slice(0, 5))
