import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Parse CSV
const raw = readFileSync(new URL('./glide_sheet_latest.csv', import.meta.url), 'utf8')
const lines = raw.split(/\r?\n/)
const header = lines[0].split(',').map(h => h.trim())
const mailIdx = header.indexOf('mail')
const lineIdx = header.indexOf('line_user_id')
const memberIdx = header.indexOf('membership_number')
console.log('columns: mail=', mailIdx, 'line_user_id=', lineIdx, 'membership_number=', memberIdx)

// Simple CSV parse (Glide CSV — fields may contain commas in some cases)
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

const sheetMap = new Map()  // line_user_id → { mail, member }
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue
  const cols = parseLine(lines[i])
  const mail = cols[mailIdx]?.trim()
  const lid = cols[lineIdx]?.trim()
  const member = cols[memberIdx]?.trim()
  if (lid && lid.startsWith('U')) sheetMap.set(lid, { mail, member })
}
console.log(`sheet line_user_ids: ${sheetMap.size}`)

// DB line_user_ids
const [{ data: pIds }, { data: gIds }] = await Promise.all([
  s.from('profiles').select('line_user_id, mail, membership_number').not('line_user_id', 'is', null).neq('line_user_id', ''),
  s.from('glide_users').select('line_user_id, mail, membership_number').not('line_user_id', 'is', null).neq('line_user_id', ''),
])
const dbSet = new Set()
for (const r of pIds) dbSet.add(r.line_user_id)
for (const r of gIds) dbSet.add(r.line_user_id)
console.log(`DB line_user_ids: ${dbSet.size}\n`)

// Sheet but not in DB
const sheetOnly = []
for (const [lid, info] of sheetMap) {
  if (!dbSet.has(lid)) sheetOnly.push({ lid, ...info })
}
console.log(`=== sheetにあるがDBに無い: ${sheetOnly.length} ===`)
for (const u of sheetOnly.slice(0, 30)) console.log(`  ${u.lid.slice(0,14)}... | ${u.member} | ${u.mail}`)
if (sheetOnly.length > 30) console.log(`  ... +${sheetOnly.length - 30} more`)

// DB but not in sheet
const dbOnly = []
for (const lid of dbSet) {
  if (!sheetMap.has(lid)) {
    const match = [...pIds, ...gIds].find(r => r.line_user_id === lid)
    dbOnly.push({ lid, mail: match?.mail, member: match?.membership_number })
  }
}
console.log(`\n=== DBにあるがsheetに無い: ${dbOnly.length} ===`)
for (const u of dbOnly.slice(0, 30)) console.log(`  ${u.lid.slice(0,14)}... | ${u.member} | ${u.mail}`)
