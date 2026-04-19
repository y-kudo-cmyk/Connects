import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: pIds } = await s.from('profiles').select('id, mail, nickname, line_user_id, membership_number').not('line_user_id', 'is', null).neq('line_user_id', '')
const { data: gIds } = await s.from('glide_users').select('mail, nickname, line_user_id, membership_number, migrated').not('line_user_id', 'is', null).neq('line_user_id', '')

console.log(`profiles with line_user_id: ${pIds.length}`)
console.log(`glide_users with line_user_id: ${gIds.length}`)

// Unique line_user_ids
const ids = new Set()
for (const r of pIds) ids.add(r.line_user_id)
for (const r of gIds) ids.add(r.line_user_id)
console.log(`unique line_user_ids: ${ids.size}\n`)

// profiles WITHOUT line_user_id (never linked)
const { count: profilesNoLine } = await s.from('profiles').select('*', { count: 'exact', head: true }).or('line_user_id.is.null,line_user_id.eq.')
console.log(`profiles WITHOUT line_user_id: ${profilesNoLine}`)

// glide_users: migrated=true but no line_user_id
const { data: migratedNoLine } = await s.from('glide_users').select('mail, nickname, membership_number').eq('migrated', true).or('line_user_id.is.null,line_user_id.eq.')
console.log(`migrated Glide users without line_user_id: ${migratedNoLine.length}`)
for (const g of migratedNoLine.slice(0, 15)) console.log(`  ${g.membership_number} | ${g.mail} | ${g.nickname}`)
if (migratedNoLine.length > 15) console.log(`  ... +${migratedNoLine.length - 15} more`)

// glide_users: NOT migrated but has line_user_id (Glide users who linked via LINE but never signed up)
const { data: notMigratedWithLine } = await s.from('glide_users').select('mail, nickname, membership_number, line_user_id').eq('migrated', false).not('line_user_id', 'is', null).neq('line_user_id', '')
console.log(`\nnot-migrated Glide users WITH line_user_id: ${notMigratedWithLine.length}`)

// Duplicate line_user_ids
const dup = new Map()
for (const r of [...pIds, ...gIds]) {
  if (!r.line_user_id) continue
  if (!dup.has(r.line_user_id)) dup.set(r.line_user_id, [])
  dup.get(r.line_user_id).push(r.mail || r.nickname || '?')
}
const actualDup = [...dup.entries()].filter(([, v]) => v.length > 1)
console.log(`\nduplicate line_user_ids: ${actualDup.length}`)
for (const [id, mails] of actualDup.slice(0, 10)) console.log(`  ${id.slice(0,12)}... : ${mails.join(', ')}`)
