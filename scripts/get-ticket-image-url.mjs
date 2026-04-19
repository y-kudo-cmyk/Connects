import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
const { data } = await s.from('my_entries').select('id, event_title, sub_event_title, ticket_image_url').eq('user_id', YUTA).not('ticket_image_url', 'is', null).neq('ticket_image_url', '').order('updated_at', { ascending: false }).limit(1)
console.log(JSON.stringify(data[0], null, 2))
