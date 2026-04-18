import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const mapping = [
  { spot: 'SP00275', email: 'ayaka.24.ysm@icloud.com' },
  { spot: 'SP00277', email: 'sena.h0622@gmail.com' },
  { spot: 'SP00278', email: 'kurea_tyiara@icloud.com' },
  { spot: 'SP00279', email: 'kurea_tyiara@icloud.com' },
]

for (const m of mapping) {
  const { error } = await s.from('spots').update({
    submitted_by: null,
    original_submitter_email: m.email,
  }).eq('id', m.spot)
  if (error) console.error(`${m.spot}:`, error.message)
  else console.log(`${m.spot} → submitted_by=null, original_submitter_email=${m.email}`)
}

// Verify
const ids = mapping.map(m => m.spot)
const { data } = await s.from('spots').select('id, spot_name, submitted_by, original_submitter_email').in('id', ids)
console.log('\nresult:')
for (const r of data) console.log(`  ${r.id} | ${r.spot_name} | by=${r.submitted_by} | email=${r.original_submitter_email}`)
