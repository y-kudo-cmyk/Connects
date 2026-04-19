import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const email = 'nanan.duck.03@icloud.com'

// check glide_users
const { data: gu } = await s.from('glide_users').select('*').eq('mail', email).maybeSingle()
console.log('glide_users:', gu ? `member=${gu.membership_number} line=${gu.line_user_id || '-'}` : 'not found')

// update SP00278
const { error } = await s.from('spots').update({
  submitted_by: null,
  original_submitter_email: email,
}).eq('id', 'SP00278')
if (error) { console.error(error); process.exit(1) }

const { data } = await s.from('spots').select('id, spot_name, submitted_by, original_submitter_email').in('id', ['SP00278', 'SP00279'])
console.log('\nresult:')
for (const r of data) console.log(`  ${r.id} | ${r.spot_name} | by=${r.submitted_by} | email=${r.original_submitter_email}`)
