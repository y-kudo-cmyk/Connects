import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
const { data } = await s.from('my_entries').select('*').eq('user_id', YUTA).ilike('event_title', '%POPUP%')
console.log(`POPUP entries for yuta: ${data.length}`)
for (const e of data) {
  console.log(`  id: ${e.id}`)
  console.log(`    event: ${e.event_title} / ${e.sub_event_title}`)
  console.log(`    tag: ${e.tag}  start: ${e.start_date}`)
  console.log(`    ticket_image_url: ${e.ticket_image_url}`)
  console.log(`    view_image_url: ${e.view_image_url}`)
  console.log(`    image_url: ${e.image_url}`)
  console.log(`    seat_info: ${JSON.stringify(e.seat_info)}`)
  console.log(`    created: ${e.created_at} / updated: ${e.updated_at}`)
}

// Also check recent ticket uploads
const { data: tkt } = await s.from('my_entries').select('id, event_title, sub_event_title, ticket_image_url, updated_at').eq('user_id', YUTA).not('ticket_image_url', 'is', null).neq('ticket_image_url', '').order('updated_at', { ascending: false }).limit(5)
console.log(`\nwith ticket image:`)
for (const e of tkt) console.log(`  ${e.updated_at.slice(0,19)} | ${e.event_title} / ${e.sub_event_title} | ${e.ticket_image_url.slice(0,80)}`)
