import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Delete misfiled INCLUDED versions (limited b/c/d, flash price — don't belong to 17 IS RIGHT HERE)
const MISFILED = ['V_KR021_03', 'V_KR021_04', 'V_KR021_05', 'V_KR021_06']
for (const vid of MISFILED) {
  const { count: cardCount } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', vid)
  const { error: cErr } = await s.from('card_master').delete().eq('version_id', vid)
  if (cErr) console.error(`${vid} cards:`, cErr.message)
  const { error: vErr } = await s.from('card_versions').delete().eq('version_id', vid)
  if (vErr) console.error(`${vid} version:`, vErr.message)
  else console.log(`deleted ${vid} (+ ${cardCount} cards)`)
}

// Rename "carat" → "CARAT"
await s.from('card_versions').update({ version_name: 'CARAT' }).eq('version_id', 'V_KR021_07')
console.log('renamed V_KR021_07: carat → CARAT')

// Verify
const { data: versions } = await s.from('card_versions').select('version_id, version_name, tier, sort_order').eq('product_id', 'P_KR021').order('tier').order('sort_order').order('version_id')
console.log(`\n== P_KR021 after fix (${versions.length} versions) ==`)
for (const v of versions) {
  const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.version_id)
  console.log(`  ${v.version_id} | tier=${v.tier} | sort=${v.sort_order} | ${v.version_name} | cards=${count}`)
}
