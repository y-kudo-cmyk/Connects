import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const id = 'b0a58c3d-0a79-488e-bfb3-cc999bc7ffe4'
const seatInfo = {
  fields: [
    { label: '券種', value: 'A席' },
    { label: 'ブロック', value: 'W41' },
    { label: '列', value: '6' },
    { label: '番', value: '2' },
  ],
}
const { error } = await s.from('my_entries').update({ seat_info: seatInfo }).eq('id', id)
if (error) console.error(error)
else console.log('saved')
const { data } = await s.from('my_entries').select('event_title, sub_event_title, seat_info').eq('id', id).maybeSingle()
console.log(JSON.stringify(data, null, 2))
