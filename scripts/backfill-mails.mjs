// profiles.mail が null の各ユーザーについて auth.admin.getUserById で email 取得し更新
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: nullMails } = await s.from('profiles').select('id, nickname').is('mail', null)
console.log(`${nullMails.length} profiles with null mail\n`)

let fixed = 0, noEmail = 0, errors = 0
for (const p of nullMails) {
  try {
    const { data: auth, error } = await s.auth.admin.getUserById(p.id)
    if (error) { console.error(`  ${p.id.slice(0,8)} err: ${error.message}`); errors++; continue }
    const email = auth?.user?.email
    if (!email) { console.log(`  ${p.id.slice(0,8)} ${p.nickname}: no email in auth.users`); noEmail++; continue }
    const { error: uErr } = await s.from('profiles').update({ mail: email }).eq('id', p.id)
    if (uErr) { console.error(`  ${p.id.slice(0,8)} update err: ${uErr.message}`); errors++; continue }
    console.log(`  ✓ ${p.id.slice(0,8)} ${p.nickname} → ${email}`)
    fixed++
  } catch (e) {
    console.error(`  ${p.id.slice(0,8)} ex: ${e.message}`)
    errors++
  }
}

console.log(`\nDone: fixed ${fixed}, no email ${noEmail}, errors ${errors}`)
