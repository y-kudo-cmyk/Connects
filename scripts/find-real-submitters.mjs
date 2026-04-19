import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// glide_users by mail/line_user_id
const { data: gu } = await s.from('glide_users').select('*').or('mail.eq.yuta129@gmail.com,line_user_id.eq.Ub88e74f829aeecc9d5fa1cfee7161199,mail.eq.y-kudo@connectsplus.net')
console.log('glide_users matches:', gu?.length || 0)
for (const g of gu || []) console.log(`  mail=${g.mail} line=${g.line_user_id} user_name=${g.user_name} membership=${g.membership_number}`)

// profiles with line_user_id
const { data: p1 } = await s.from('profiles').select('id, nickname, line_user_id, email').eq('line_user_id', 'Ub88e74f829aeecc9d5fa1cfee7161199')
console.log('\nprofile by line_user_id:', p1)

// auth users lookup
const { data: allU } = await s.auth.admin.listUsers({ perPage: 1000 })
console.log(`\ntotal auth users page1: ${allU.users.length}`)
const yuta129 = allU.users.find(u => u.email === 'yuta129@gmail.com')
const ykudo = allU.users.find(u => u.email === 'y-kudo@connectsplus.net')
console.log('yuta129:', yuta129?.id, yuta129?.email)
console.log('ykudo:', ykudo?.id, ykudo?.email)

// Find spots by address
for (const [addr, label] of [
  ['千日前1-5-16', 'ykudo spot'],
  ['西新橋1丁目14-9', 'yuta129 spot'],
  ['1 Pl. Clemenceau', 'line-user spot'],
]) {
  const { data } = await s.from('spots').select('id, spot_name, spot_address, submitted_by').ilike('spot_address', `%${addr}%`)
  console.log(`\n${label} (${addr}):`)
  for (const sp of data || []) console.log(`  ${sp.id} | ${sp.spot_name} | by=${sp.submitted_by}`)
}
