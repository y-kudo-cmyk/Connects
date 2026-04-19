import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const NEW_ID = 'Ud2f8112d489103e72c6a512111696c84'
const OLD_ID = 'Ud2f8112d48910520ecd6ada5d43d1d9c'

// Verify the new ID is valid via LINE profile API
const res = await fetch(`https://api.line.me/v2/bot/profile/${NEW_ID}`, { headers: { Authorization: `Bearer ${TOKEN}` } })
console.log(`profile check for ${NEW_ID}: ${res.status}`)
if (res.ok) console.log('  ', await res.json())

// Also check OLD
const res2 = await fetch(`https://api.line.me/v2/bot/profile/${OLD_ID}`, { headers: { Authorization: `Bearer ${TOKEN}` } })
console.log(`profile check for ${OLD_ID}: ${res2.status}`)

// Update DB
const { data: existing } = await s.from('glide_users').select('membership_number, mail, line_user_id').or(`line_user_id.eq.${OLD_ID},line_user_id.eq.${NEW_ID}`)
console.log('matching glide_users:', existing)

if (existing?.length) {
  for (const g of existing) {
    await s.from('glide_users').update({ line_user_id: NEW_ID }).eq('membership_number', g.membership_number)
    console.log(`updated ${g.membership_number} ${g.mail} → ${NEW_ID}`)
  }
}
