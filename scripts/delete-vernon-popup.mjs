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

const ID = '96e9a1ff-dc26-442b-a935-99fc477ef3d8'
const { data: pre } = await supabase.from('events').select('id, tag, event_title, start_date, end_date').eq('id', ID).single()
console.log('Before:', pre)

await supabase.from('event_votes').delete().eq('event_id', ID)
const { error, count } = await supabase.from('events').delete({ count: 'exact' }).eq('id', ID)
console.log(error ? `Error: ${error.message}` : `Deleted ${count} row(s)`)
