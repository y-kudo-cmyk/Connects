import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { count: pTotal } = await s.from('profiles').select('*', { count: 'exact', head: true })
const { count: pWithLine } = await s.from('profiles').select('*', { count: 'exact', head: true }).not('line_user_id', 'is', null).neq('line_user_id', '')
const { count: gTotal } = await s.from('glide_users').select('*', { count: 'exact', head: true })
const { count: gWithLine } = await s.from('glide_users').select('*', { count: 'exact', head: true }).not('line_user_id', 'is', null).neq('line_user_id', '')

console.log(`profiles: ${pTotal} total, ${pWithLine} with line_user_id`)
console.log(`glide_users: ${gTotal} total, ${gWithLine} with line_user_id`)

// Dedupe count
const [{ data: p }, { data: g }] = await Promise.all([
  s.from('profiles').select('line_user_id').not('line_user_id', 'is', null).neq('line_user_id', ''),
  s.from('glide_users').select('line_user_id').not('line_user_id', 'is', null).neq('line_user_id', ''),
])
const ids = new Set()
for (const r of p || []) if (r.line_user_id) ids.add(r.line_user_id)
for (const r of g || []) if (r.line_user_id) ids.add(r.line_user_id)
console.log(`Unique LINE IDs (profiles ∪ glide_users): ${ids.size}`)

// Sample
console.log('\nSample glide_users with LINE ID:')
const { data: sample } = await s.from('glide_users').select('mail, line_user_id').not('line_user_id', 'is', null).neq('line_user_id', '').limit(5)
for (const r of sample || []) console.log(`  ${r.mail} → ${r.line_user_id.slice(0, 12)}...`)
