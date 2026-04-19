import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data } = await s.from('announcements').select('*').order('created_at', { ascending: false }).limit(10)
for (const a of data || []) {
  console.log(`pub=${a.published} pri=${a.priority} | ${a.created_at?.slice(0,16)} | ${a.title}`)
  console.log(`  body: ${a.body?.slice(0, 150)}`)
  if (a.link_url) console.log(`  link: ${a.link_url}`)
  console.log('')
}
