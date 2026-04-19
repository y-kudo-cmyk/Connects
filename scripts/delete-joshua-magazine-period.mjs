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

const TARGET_ID = '05b52521-609a-48e6-8fdf-c66c93ea9031'

// Sanity check before delete
const { data: pre } = await supabase.from('events').select('id, tag, event_title, start_date, end_date').eq('id', TARGET_ID).single()
console.log('Before delete:', pre)

const { error: voteErr } = await supabase.from('event_votes').delete().eq('event_id', TARGET_ID)
if (voteErr) console.log('event_votes cleanup:', voteErr.message)

const { error, count } = await supabase.from('events').delete({ count: 'exact' }).eq('id', TARGET_ID)
if (error) { console.error('Delete failed:', error.message); process.exit(1) }
console.log(`Deleted ${count} row(s)`)

const { data: after } = await supabase.from('events').select('id').eq('id', TARGET_ID)
console.log('After delete, found:', after?.length ?? 0, 'rows (should be 0)')
