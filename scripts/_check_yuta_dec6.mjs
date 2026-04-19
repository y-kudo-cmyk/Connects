import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
const { data, error } = await s.from('my_entries').select('id, event_title, sub_event_title, tag, start_date, ticket_image_url, updated_at').eq('user_id', YUTA).gte('start_date', '2024-12-06T00:00:00').lt('start_date', '2024-12-07T00:00:00')
if (error) console.error(error)
if (!data) { console.log('no data'); process.exit(0) }
console.log(`12/6 entries: ${data.length}`)
for (const e of data) {
  console.log(`  id=${e.id}`)
  console.log(`    ${e.start_date} | ${e.tag} | ${e.event_title} / ${e.sub_event_title || ''}`)
  console.log(`    ticket_image_url: ${e.ticket_image_url || '(empty)'}`)
  console.log(`    updated: ${e.updated_at}`)
}

// Also most recent updates in general
console.log('\nrecent 5 updates:')
const { data: recent } = await s.from('my_entries').select('id, event_title, sub_event_title, tag, ticket_image_url, updated_at').eq('user_id', YUTA).order('updated_at', { ascending: false }).limit(5)
for (const e of recent) {
  console.log(`  ${e.updated_at.slice(0,19)} | tkt:${e.ticket_image_url ? '✓' : '—'} | ${e.event_title} / ${e.sub_event_title || ''}`)
}
