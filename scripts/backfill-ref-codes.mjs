// profiles.ref_code が空のユーザーに対して、glide_users.mail で照合して ref_code を補完。
// introduced_by も同じく。
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: profs } = await s.from('profiles').select('id, mail, ref_code, introduced_by, nickname').not('mail', 'is', null).neq('mail', '')
console.log(`profiles with mail: ${profs.length}`)

let fixed = 0, noGlide = 0
for (const p of profs) {
  if (p.ref_code) continue  // already set
  const { data: g } = await s.from('glide_users').select('ref_code, introduced_by').ilike('mail', p.mail.toLowerCase().trim()).maybeSingle()
  if (!g?.ref_code) { noGlide++; continue }
  const updates = { ref_code: g.ref_code }
  if (!p.introduced_by && g.introduced_by) updates.introduced_by = g.introduced_by
  const { error } = await s.from('profiles').update(updates).eq('id', p.id)
  if (error) console.error(`  ${p.id.slice(0,8)} err: ${error.message}`)
  else { console.log(`  ✓ ${p.nickname} (${p.mail}) → ${g.ref_code}`); fixed++ }
}
console.log(`\nfixed ${fixed}, no glide match ${noGlide}`)
