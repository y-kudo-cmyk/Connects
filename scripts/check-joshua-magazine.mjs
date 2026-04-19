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

// First inspect schema
const { data: sample } = await supabase.from('events').select('*').limit(1)
console.log('== Event columns ==')
if (sample && sample[0]) console.log(Object.keys(sample[0]).join(', '))
console.log('')

const { data, error } = await supabase
  .from('events')
  .select('*')
  .or('event_title.ilike.%JOSHUA%,event_title.ilike.%ジョシュ%,sub_event_title.ilike.%JOSHUA%,sub_event_title.ilike.%ジョシュ%')
  .order('created_at', { ascending: false })
  .limit(10)

if (error) {
  console.error('Error:', error)
  process.exit(1)
}
console.log(`Found ${data.length} JOSHUA events`)
for (const r of data) {
  console.log(JSON.stringify(r, null, 2))
}
