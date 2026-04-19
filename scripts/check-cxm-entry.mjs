import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
const { data } = await s.from('my_entries').select('*').eq('user_id', YUTA).eq('tag', 'LIVE').ilike('event_title', '%CxM%')
console.log('CxM entries:')
for (const e of data) {
  console.log(JSON.stringify(e, null, 2))
}

// also lookup event
if (data.length && data[0].event_id) {
  const { data: ev } = await s.from('events').select('id, title, type, country, start_date, end_date').eq('id', data[0].event_id).maybeSingle()
  console.log('\nevent row:', ev)
}
