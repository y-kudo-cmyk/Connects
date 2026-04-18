import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// find 10/12 ODE TO YOU LIVE/JP
const { data: rows } = await s.from('events').select('id, start_date, event_title, status')
  .eq('tag', 'LIVE').eq('country', 'JP')
  .ilike('event_title', '%ODE TO YOU%')
  .gte('start_date', '2019-10-12').lte('start_date', '2019-10-12T23:59:59')
console.log('found:', rows)

if (rows?.length) {
  const { error } = await s.from('events').update({ status: 'cancelled' }).eq('id', rows[0].id)
  if (error) console.error(error)
  else console.log(`marked cancelled: ${rows[0].id}`)
}
