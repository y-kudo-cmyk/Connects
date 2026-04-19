import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
if (!TOKEN) { console.error('LINE_CHANNEL_ACCESS_TOKEN not set'); process.exit(1) }

// 1. Fetch all followers from LINE API (paginated)
const followers = new Set()
let start
let page = 0
while (true) {
  page++
  const url = 'https://api.line.me/v2/bot/followers/ids' + (start ? `?start=${start}` : '')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
  if (!res.ok) {
    console.error(`page ${page}: ${res.status} ${await res.text()}`)
    break
  }
  const data = await res.json()
  for (const id of data.userIds || []) followers.add(id)
  console.log(`page ${page}: +${data.userIds?.length || 0} (total ${followers.size})`)
  if (!data.next) break
  start = data.next
}
console.log(`\nLINE friends total: ${followers.size}`)

// 2. DB line_user_ids
const { data: pIds } = await s.from('profiles').select('id, mail, nickname, line_user_id').not('line_user_id', 'is', null).neq('line_user_id', '')
const { data: gIds } = await s.from('glide_users').select('mail, nickname, membership_number, line_user_id').not('line_user_id', 'is', null).neq('line_user_id', '')

const dbIds = new Map()  // line_user_id → { mail, nickname, source }
for (const r of pIds) dbIds.set(r.line_user_id, { mail: r.mail, nickname: r.nickname, source: 'profile' })
for (const r of gIds) {
  if (!dbIds.has(r.line_user_id)) {
    dbIds.set(r.line_user_id, { mail: r.mail, nickname: r.nickname, source: `glide/${r.membership_number}` })
  }
}
console.log(`DB line_user_ids: ${dbIds.size}`)

// 3. Cross-reference
const notFollowers = []
for (const [lid, info] of dbIds) {
  if (!followers.has(lid)) notFollowers.push({ lid, ...info })
}
console.log(`\n=== DB登録だが LINE友だちリストに無い人: ${notFollowers.length} ===`)
for (const u of notFollowers.slice(0, 100)) {
  console.log(`  ${u.lid.slice(0,12)}... | ${u.source} | ${u.mail || '-'} | ${u.nickname || '-'}`)
}
if (notFollowers.length > 100) console.log(`  ... +${notFollowers.length - 100} more`)

// 4. Reverse: friends in LINE but not in DB
const unknownFollowers = [...followers].filter(id => !dbIds.has(id))
console.log(`\n=== LINE友だちだが DBに無いid: ${unknownFollowers.length} (emailリンク未完了)  ===`)
for (const id of unknownFollowers.slice(0, 20)) console.log(`  ${id}`)
if (unknownFollowers.length > 20) console.log(`  ... +${unknownFollowers.length - 20} more`)
