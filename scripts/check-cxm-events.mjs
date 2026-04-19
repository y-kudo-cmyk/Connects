import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await s.from('events').select('id, event_title, sub_event_title, tag, country, start_date, spot_name').ilike('event_title', '%CxM%').order('start_date', { ascending: false })
console.log(`events matching CxM: ${data.length}\n`)
for (const e of data) {
  console.log(`${(e.start_date || '').slice(0,10)} | [${e.tag}/${e.country}] | ${e.spot_name || '-'} | ${e.event_title}${e.sub_event_title ? ' / ' + e.sub_event_title : ''} (id=${e.id})`)
}
