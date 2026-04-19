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

const YKUDO_ID = '65ba4bc6-917d-4689-aeaf-8d4b5b01a004'

// All unpublished announcements
console.log('== All announcements ==')
const { data: ann } = await supabase
  .from('announcements')
  .select('id, title, published, created_at')
  .order('created_at', { ascending: false })
  .limit(30)
for (const a of ann || []) {
  console.log(`  pub=${a.published} | ${a.created_at?.slice(0,16)} | ${a.title?.slice(0, 60)}`)
}

// Any table with y-kudo as creator/user
console.log('')
console.log('== tables with y-kudo rows ==')
for (const t of ['user_cards', 'my_entries', 'user_posts', 'posts', 'user_trades']) {
  const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true }).eq('user_id', YKUDO_ID)
  if (error) { console.log(`  ${t}: (no table: ${error.code})`); continue }
  console.log(`  ${t}: ${count} rows`)
}
