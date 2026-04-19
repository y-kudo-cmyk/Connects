import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Check spots with mail-like pattern in ANY text field
for (const id of ['SP00275', 'SP00276', 'SP00277', 'SP00278', 'SP00279']) {
  const { data } = await s.from('spots').select('*').eq('id', id).maybeSingle()
  console.log(`\n=== ${id} ${data?.spot_name} ===`)
  // print all non-empty fields
  for (const [k, v] of Object.entries(data || {})) {
    if (v !== null && v !== '' && v !== false && v !== 0) console.log(`  ${k}: ${typeof v === 'string' && v.length > 100 ? v.slice(0,100) + '...' : v}`)
  }
}

// url_submissions table
console.log('\n=== url_submissions cols ===')
const { data: u } = await s.from('url_submissions').select('*').limit(3)
console.log(u?.[0] ? Object.keys(u[0]) : 'empty')
console.log(u)
