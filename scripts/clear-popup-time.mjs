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

const ID = '0137c771-3f0b-4b77-8e5b-572d77cb2f98'
const { error, data } = await supabase.from('events')
  .update({ start_date: '2026-04-18T00:00:00', end_date: '2026-04-22T00:00:00' })
  .eq('id', ID)
  .select()
  .single()
if (error) { console.error(error); process.exit(1) }
console.log('Updated:', { id: data.id, start: data.start_date, end: data.end_date })
