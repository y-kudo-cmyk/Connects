import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
const YKUDO = '65ba4bc6'  // partial

// Find both admin accounts by role
const { data: admins } = await s.from('profiles').select('id, mail, nickname').eq('role', 'admin')
console.log('admins:', admins.map(a => `${a.mail} (${a.id.slice(0,8)})`).join(', '))

for (const a of admins) {
  const { data } = await s.from('my_entries').select('id, event_title, sub_event_title, tag, start_date, ticket_image_url, updated_at, created_at').eq('user_id', a.id).order('updated_at', { ascending: false }).limit(10)
  console.log(`\n== ${a.mail} (${a.nickname}) — ${data?.length || 0} entries ==`)
  for (const e of (data || [])) {
    const hasTicket = e.ticket_image_url && e.ticket_image_url !== '' ? '✓' : '—'
    console.log(`  ${e.updated_at?.slice(0,19)} | tkt:${hasTicket} | ${e.tag} | ${e.event_title} / ${e.sub_event_title || ''} | ${e.start_date}`)
  }
}
