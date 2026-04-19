import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// YUTA + U000002 activity
const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
const U2 = '65ba4bc6-917d-4689-aeaf-8d4b5b01a004'

for (const uid of [YUTA, U2]) {
  const { count: editCount } = await s.from('user_activity').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('action', 'edit')
  const { count: total } = await s.from('user_activity').select('*', { count: 'exact', head: true }).eq('user_id', uid)
  console.log(`\n${uid} (${uid === YUTA ? 'YUTA' : 'U000002'})`)
  console.log(`  total: ${total}`)
  console.log(`  edit: ${editCount}`)
  // breakdown by action
  const { data: acts } = await s.from('user_activity').select('action').eq('user_id', uid)
  const counts = new Map()
  for (const r of acts || []) counts.set(r.action, (counts.get(r.action) || 0) + 1)
  for (const [k, v] of [...counts.entries()].sort((a, b) => b[1] - a[1])) console.log(`    ${k}: ${v}`)
}

// Last 10 edits
console.log(`\nrecent edits (any user):`)
const { data: recent } = await s.from('user_activity').select('user_id, action, detail, created_at').eq('action', 'edit').order('created_at', { ascending: false }).limit(10)
for (const r of recent || []) console.log(`  ${r.created_at?.slice(0,19)} | ${r.user_id?.slice(0,8)} | ${r.detail}`)
