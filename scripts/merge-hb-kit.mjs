import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const KEEP = 'V_KR023_06'   // will become "KIT Ver"
const DROP = 'V_KR023_07'   // cards move to KEEP, then version deleted

// 1. Move all cards from DROP → KEEP
const { data: moved, error: e1 } = await s.from('card_master').update({ version_id: KEEP }).eq('version_id', DROP).select('id, member_id, card_detail')
if (e1) { console.error(e1); process.exit(1) }
console.log(`Moved cards: ${moved.length}`)

// 2. Rename KEEP version to "KIT Ver"
const { error: e2 } = await s.from('card_versions').update({ version_name: 'KIT Ver', sort_order: 6 }).eq('version_id', KEEP)
if (e2) { console.error(e2); process.exit(1) }

// 3. Delete DROP version
const { error: e3, count: delCount } = await s.from('card_versions').delete({ count: 'exact' }).eq('version_id', DROP)
if (e3) { console.error(e3); process.exit(1) }
console.log(`Deleted version: ${delCount}`)

// 4. Verify
const { data: cards } = await s.from('card_master').select('id, member_id, card_detail').eq('version_id', KEEP).order('member_id')
console.log(`\nKIT Ver now has: ${cards.length} cards`)
const byMember = new Map()
for (const c of cards) {
  if (!byMember.has(c.member_id)) byMember.set(c.member_id, [])
  byMember.get(c.member_id).push(c.card_detail)
}
for (const [m, details] of byMember) console.log(`  ${m}: ${details.join(', ')}`)
