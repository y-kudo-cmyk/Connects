import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Serenade-specific names checked in HB versions
const { data: hbVersions } = await s.from('card_versions').select('*').eq('product_id', 'P_KR023').order('version_id')
console.log('=== P_KR023 HAPPY BURSTDAY versions ===')
for (const v of hbVersions || []) console.log(`  ${v.version_id} | ${v.version_name} | tier=${v.tier || '?'}`)

console.log('')
const { data: serVersions } = await s.from('card_versions').select('*').eq('product_id', 'P_UN005').order('version_id')
console.log('=== P_UN005 SERENADE versions ===')
for (const v of serVersions || []) console.log(`  ${v.version_id} | ${v.version_name} | tier=${v.tier || '?'}`)

// cross-contamination check (is any HB card's version_id actually a Serenade version_id?)
const hbVids = new Set(hbVersions.map(v => v.version_id))
const serVids = new Set(serVersions.map(v => v.version_id))
const { data: hbCards } = await s.from('card_master').select('id, version_id, member_name, card_detail').eq('product_id', 'P_KR023')
const { data: serCards } = await s.from('card_master').select('id, version_id, member_name, card_detail').eq('product_id', 'P_UN005')
console.log('')
const hbOrphans = hbCards.filter(c => !hbVids.has(c.version_id))
const serOrphans = serCards.filter(c => !serVids.has(c.version_id))
console.log(`HB cards with version_id not in HB versions: ${hbOrphans.length}`)
console.log(`Serenade cards with version_id not in Serenade versions: ${serOrphans.length}`)
if (hbOrphans.length) console.log('  HB orphan sample:', hbOrphans.slice(0, 3))
if (serOrphans.length) console.log('  Serenade orphan sample:', serOrphans.slice(0, 3))
