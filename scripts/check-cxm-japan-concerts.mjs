import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Get ALL CxM DOUBLE UP JAPAN events (LIVE, TICKET, etc.) for venue/date
const { data } = await s.from('events').select('id, event_title, sub_event_title, tag, country, start_date, spot_name, spot_address')
  .ilike('event_title', '%CxM%DOUBLE UP%JAPAN%')
  .eq('country', 'JP')
  .order('start_date', { ascending: true })

console.log(`CxM DOUBLE UP JAPAN events: ${data.length}\n`)
for (const e of data) {
  console.log(`${(e.start_date || '').slice(0,10)} | [${e.tag}] | ${e.spot_name || '-'} | ${e.event_title}${e.sub_event_title ? ' / ' + e.sub_event_title : ''}`)
}

// What does Seventeen-17.jp usually list for concert dates? Look at TICKET-tagged IGアリーナ entries
console.log('\n=== TICKET-tagged 愛知公演 ===')
const { data: tickets } = await s.from('events').select('id, event_title, sub_event_title, start_date, end_date, spot_name')
  .eq('country', 'JP')
  .eq('tag', 'TICKET')
  .ilike('event_title', '%CxM%DOUBLE UP%')
  .order('start_date', { ascending: true })
for (const e of tickets) {
  console.log(`${(e.start_date || '').slice(0,10)} ~ ${(e.end_date || '').slice(0,10)} | ${e.spot_name || '-'} | ${e.event_title}${e.sub_event_title ? ' / ' + e.sub_event_title : ''}`)
}
