import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
if (!TOKEN) { console.error('LINE_CHANNEL_ACCESS_TOKEN not set'); process.exit(1) }

// Collect all DB line_user_ids
const { data: pIds } = await s.from('profiles').select('mail, nickname, line_user_id').not('line_user_id', 'is', null).neq('line_user_id', '')
const { data: gIds } = await s.from('glide_users').select('mail, nickname, membership_number, line_user_id').not('line_user_id', 'is', null).neq('line_user_id', '')

const unique = new Map()
for (const r of pIds) if (!unique.has(r.line_user_id)) unique.set(r.line_user_id, { source: 'profile', mail: r.mail, nickname: r.nickname })
for (const r of gIds) if (!unique.has(r.line_user_id)) unique.set(r.line_user_id, { source: `glide/${r.membership_number}`, mail: r.mail, nickname: r.nickname })
console.log(`checking ${unique.size} line_user_ids...\n`)

const blocked = []
const ok = []
let i = 0
for (const [lid, info] of unique) {
  i++
  if (i % 20 === 0) console.log(`  ${i}/${unique.size}...`)
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${lid}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    if (res.status === 200) ok.push({ lid, ...info })
    else blocked.push({ lid, ...info, status: res.status })
  } catch (e) {
    blocked.push({ lid, ...info, status: 'error', err: e.message })
  }
  // rate limit: LINE API ~1000 req/min = 16/sec, keep under
  await new Promise(r => setTimeout(r, 50))
}

console.log(`\nfollower: ${ok.length}`)
console.log(`blocked/unfriended/unknown: ${blocked.length}`)

console.log(`\n=== 友だち解除/ブロック (${blocked.length}) ===`)
for (const b of blocked.slice(0, 80)) {
  console.log(`  ${b.lid.slice(0,12)}... | ${b.source} | ${b.mail || '-'} | ${b.nickname || '-'} | status=${b.status}`)
}
if (blocked.length > 80) console.log(`  ... +${blocked.length - 80} more`)
