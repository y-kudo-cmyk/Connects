import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const { data } = await supabase
  .from('events')
  .select('id, tag, event_title, sub_event_title, start_date, end_date, source_url, created_at')
  .or('event_title.ilike.%エスクァイア%,event_title.ilike.%Esquire%,event_title.ilike.%雑誌%,event_title.ilike.%表紙%,event_title.ilike.%6月号%,event_title.ilike.%MAGAZINE%')
  .order('created_at', { ascending: false })

console.log(`Hit: ${data.length}`)
for (const r of data) {
  const end = r.end_date ? `END=${r.end_date.slice(0,10)}` : 'single'
  console.log(`${r.id.slice(0,8)} | ${r.tag.padEnd(8)} | ${r.start_date?.slice(0,10)} | ${end} | ${r.event_title.slice(0, 70)}`)
}
