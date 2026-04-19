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

const { data, count, error } = await supabase
  .from('user_cards')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })
  .limit(20)

if (error) { console.error(error); process.exit(1) }
console.log(`Total user_cards rows in DB: ${count}`)
console.log(`Recent (last 20):`)
for (const r of data || []) {
  console.log(`  ${r.created_at?.slice(0,16)} | user=${r.user_id?.slice(0,8)} | ${r.product_id} | ${r.member_name} | ${r.status}`)
}

// Also check storage for any uploaded files
const { data: files } = await supabase.storage.from('card-images').list('cards', { limit: 20 })
console.log('')
console.log('Storage cards/ folder:')
for (const f of files || []) console.log(`  ${f.name}`)
