import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const mapping = [
  { spot: 'SP00275', name: 'さぬき家',        email: 'ayaka.24.ysm@icloud.com' },
  { spot: 'SP00277', name: 'winks',           email: 'sena.h0622@gmail.com' },
  { spot: 'SP00278', name: 'パークハイアット京都', email: 'kurea_tyiara@icloud.com' },
  { spot: 'SP00279', name: '御津(三角)公園',   email: 'kurea_tyiara@icloud.com' },
]

for (const m of mapping) {
  console.log(`\n=== ${m.spot} ${m.name} ===`)
  console.log(`  email: ${m.email}`)

  // glide_users lookup
  const { data: gu } = await s.from('glide_users').select('*').eq('mail', m.email).maybeSingle()
  console.log(`  glide_users: ${gu ? `member=${gu.membership_number} line=${gu.line_user_id || '-'} migrated=${gu.migrated}` : 'not found'}`)

  // profiles by email
  const { data: pr } = await s.from('profiles').select('id, membership_number, nickname, line_user_id, email').eq('email', m.email).maybeSingle()
  console.log(`  profiles.email: ${pr ? `id=${pr.id} mem=${pr.membership_number}` : 'not found'}`)

  // profiles by membership_number (from glide)
  if (gu?.membership_number) {
    const { data: pr2 } = await s.from('profiles').select('id, membership_number, nickname, email').eq('membership_number', gu.membership_number).maybeSingle()
    console.log(`  profiles.membership(${gu.membership_number}): ${pr2 ? `id=${pr2.id}` : 'not found'}`)
  }

  // profiles by line_user_id
  if (gu?.line_user_id) {
    const { data: pr3 } = await s.from('profiles').select('id, membership_number, nickname').eq('line_user_id', gu.line_user_id).maybeSingle()
    console.log(`  profiles.line: ${pr3 ? `id=${pr3.id}` : 'not found'}`)
  }
}
