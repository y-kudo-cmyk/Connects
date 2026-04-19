import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
const today = new Date().toISOString().slice(0,10)
const jst = new Date(Date.now() + 9*60*60*1000).toISOString().slice(0,10)
console.log('today UTC:', today, 'JST:', jst)

const { data } = await s.from('my_entries').select('event_title, tag, start_date, end_date').eq('user_id', YUTA).gte('start_date', jst + 'T00:00:00').lte('start_date', jst + 'T23:59:59')
console.log(`\ntoday's entries (${data.length}):`)
for (const e of data) console.log(`  ${e.start_date} | ${e.tag} | ${e.event_title}`)

// Also end_date today
const { data: ending } = await s.from('my_entries').select('event_title, tag, start_date, end_date').eq('user_id', YUTA).gte('end_date', jst + 'T00:00:00').lte('end_date', jst + 'T23:59:59')
console.log(`\nending today (${ending.length}):`)
for (const e of ending) console.log(`  end=${e.end_date} | ${e.tag} | ${e.event_title}`)
