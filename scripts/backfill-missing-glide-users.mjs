import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Parse CSV
const raw = readFileSync(new URL('./glide_sheet_latest.csv', import.meta.url), 'utf8')
const lines = raw.split(/\r?\n/)
function parseLine(line) {
  const out = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { inQ = !inQ; continue }
    if (c === ',' && !inQ) { out.push(cur); cur = ''; continue }
    cur += c
  }
  out.push(cur)
  return out
}

const MISSING_MEMBERS = new Set(['U000078', 'U000142', 'U001022', 'U001271'])

const rows = []
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue
  const cols = parseLine(lines[i])
  const member = cols[2]?.trim()
  if (!MISSING_MEMBERS.has(member)) continue
  rows.push({
    mail: cols[0]?.trim() || '',
    line_user_id: cols[1]?.trim() || '',
    membership_number: member,
    nickname: cols[3]?.trim() || null,
    join_date: cols[5]?.trim() || null,
    role: cols[6]?.trim() || 'user',
    avatar_url: cols[7]?.trim() || null,
    banner_url: cols[8]?.trim() || null,
    fav_artist: cols[11]?.trim() || null,
    ref_code: cols[18]?.trim() || null,
    introduced_by: cols[19]?.trim() || null,
    is_verified: cols[20]?.trim() === 'TRUE',
    migrated: false,
  })
}

for (const r of rows) {
  // check if already exists (by membership_number)
  const { data: existing } = await s.from('glide_users').select('membership_number').eq('membership_number', r.membership_number).maybeSingle()
  if (existing) {
    // update line_user_id only
    await s.from('glide_users').update({ line_user_id: r.line_user_id, mail: r.mail }).eq('membership_number', r.membership_number)
    console.log(`updated ${r.membership_number} ${r.mail}`)
  } else {
    const { error } = await s.from('glide_users').insert(r)
    if (error) console.error(`insert ${r.membership_number}:`, error.message)
    else console.log(`inserted ${r.membership_number} ${r.mail}`)
  }
}

// verify
const { count } = await s.from('glide_users').select('*', { count: 'exact', head: true }).not('line_user_id', 'is', null).neq('line_user_id', '')
console.log(`\nglide_users with line_user_id (after): ${count}`)
