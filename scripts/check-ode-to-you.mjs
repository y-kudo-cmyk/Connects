import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await s.from('events').select('id, event_title, sub_event_title, tag, country, start_date, spot_name')
  .or('event_title.ilike.%ODE TO YOU%')
  .order('start_date', { ascending: true })

console.log(`ODE TO YOU events: ${data.length}`)
for (const e of data) {
  console.log(`${(e.start_date || '').slice(0,10)} | [${e.tag}/${e.country}] | ${e.spot_name || '-'} | ${e.event_title}${e.sub_event_title ? ' / ' + e.sub_event_title : ''}`)
}

// Also check YUTA's my_entries for ODE TO YOU
const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
console.log('\n=== YUTA my_entries ===')
const { data: me } = await s.from('my_entries').select('id, event_title, sub_event_title, tag, start_date, spot_name').eq('user_id', YUTA).ilike('event_title', '%ODE TO YOU%').order('start_date', { ascending: true })
for (const e of me) {
  console.log(`${(e.start_date || '').slice(0,10)} | [${e.tag}] | ${e.spot_name || '-'} | ${e.event_title}${e.sub_event_title ? ' / ' + e.sub_event_title : ''}`)
}
