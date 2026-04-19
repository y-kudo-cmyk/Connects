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

const { data, error } = await supabase
  .from('events')
  .select('id, tag, event_title, start_date, end_date, created_at')
  .eq('tag', 'MAGAZINE')
  .order('created_at', { ascending: false })
  .limit(30)

if (error) { console.error(error); process.exit(1) }
console.log(`Total MAGAZINE events: ${data.length}`)
console.log('')
for (const r of data) {
  const hasEnd = r.end_date ? `period(${r.end_date.slice(0,10)})` : 'single'
  console.log(`${r.id.slice(0,8)} | ${r.start_date?.slice(0,10)} | ${hasEnd} | ${r.event_title.slice(0, 60)}`)
}
const withEndDate = data.filter(r => r.end_date)
console.log('')
console.log(`With end_date (=period events): ${withEndDate.length}`)
