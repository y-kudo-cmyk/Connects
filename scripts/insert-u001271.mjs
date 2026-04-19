import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { error } = await s.from('glide_users').insert({
  mail: 'ra.li.17.04.610@gmail.com',
  line_user_id: 'Ud2f8112d48910520ecd6ada5d43d1d9c',
  membership_number: 'U001271',
  role: 'user',
  migrated: false,
})
if (error) {
  // try with different line_user_id - get from CSV first
  const raw = readFileSync(new URL('./glide_sheet_latest.csv', import.meta.url), 'utf8')
  const lines = raw.split(/\r?\n/)
  for (const l of lines) {
    if (l.includes('U001271')) {
      console.log('CSV row:', l.slice(0, 300))
      break
    }
  }
  console.error(error.message)
}
else console.log('inserted U001271')

const { count } = await s.from('glide_users').select('*', { count: 'exact', head: true }).not('line_user_id', 'is', null).neq('line_user_id', '')
console.log(`glide_users with line_user_id: ${count}`)
