import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'

// my_entries with ticket_image_url set, ordered by updated_at desc
const { data } = await s.from('my_entries').select('id, event_title, sub_event_title, tag, start_date, ticket_image_url, image_url, view_image_url, updated_at').eq('user_id', YUTA).not('ticket_image_url', 'is', null).neq('ticket_image_url', '').order('updated_at', { ascending: false }).limit(20)

console.log(`YUTA my_entries with ticket image: ${data.length}\n`)
for (const e of data) {
  console.log(`${e.updated_at?.slice(0,19)} | ${e.tag} | ${e.event_title}${e.sub_event_title ? ' / ' + e.sub_event_title : ''}`)
  console.log(`  ticket: ${e.ticket_image_url?.slice(0, 100)}`)
}

// also check updates from yesterday
const yesterday = '2026-04-18'
const { data: recent } = await s.from('my_entries').select('id, event_title, tag, updated_at, ticket_image_url, image_url, view_image_url').eq('user_id', YUTA).gte('updated_at', yesterday + 'T00:00:00').lt('updated_at', yesterday + 'T23:59:59').order('updated_at')
console.log(`\nentries updated on ${yesterday}: ${recent.length}`)
for (const e of recent) {
  console.log(`  ${e.updated_at?.slice(11,19)} | ${e.tag} | ${e.event_title}`)
  if (e.ticket_image_url) console.log(`    ticket: ✓`)
  if (e.image_url && e.image_url.length > 2) console.log(`    images: ✓`)
  if (e.view_image_url) console.log(`    view: ✓`)
}
