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

// Find y-kudo user
const { data: user } = await supabase
  .from('profiles')
  .select('*')
  .eq('mail', 'y-kudo@connectsplus.net')
  .single()

console.log('== y-kudo profile ==')
console.log(user ? JSON.stringify(user, null, 2) : 'NOT FOUND')

if (!user) process.exit(0)

console.log('')
console.log('== events submitted by y-kudo ==')
const { data: evs } = await supabase
  .from('events')
  .select('id, tag, event_title, start_date, status, verified_count, created_at')
  .eq('submitted_by', user.id)
  .order('created_at', { ascending: false })
  .limit(20)
console.log(`Count: ${evs?.length}`)
for (const e of evs || []) {
  console.log(`  ${e.id.slice(0,8)} | ${e.tag.padEnd(8)} | ${e.status.padEnd(10)} | v=${e.verified_count} | ${e.event_title?.slice(0, 60)}`)
}

console.log('')
console.log('== recent announcements (to compare published status) ==')
const { data: ann } = await supabase
  .from('announcements')
  .select('id, title, published, created_at')
  .order('created_at', { ascending: false })
  .limit(10)
for (const a of ann || []) {
  console.log(`  pub=${a.published} | ${a.created_at?.slice(0,16)} | ${a.title?.slice(0, 60)}`)
}
