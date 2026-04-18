import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// BEN_ 系は全部 STORE_JP、LUCKY_ は LUCKY_DRAW に
const { data: versions } = await s.from('card_versions').select('version_id').or('version_id.like.%_BEN_%,version_id.like.%_BENEFIT_%,version_id.like.%_LUCKY_%')
console.log(`target versions: ${versions.length}`)

const benIds = versions.filter(v => v.version_id.includes('_BEN_') || v.version_id.includes('_BENEFIT_')).map(v => v.version_id)
const luckyIds = versions.filter(v => v.version_id.includes('_LUCKY_')).map(v => v.version_id)

if (benIds.length) {
  await s.from('card_versions').update({ tier: 'STORE_JP' }).in('version_id', benIds)
  console.log(`  STORE_JP: ${benIds.length} versions`)
}
if (luckyIds.length) {
  await s.from('card_versions').update({ tier: 'LUCKY_DRAW' }).in('version_id', luckyIds)
  console.log(`  LUCKY_DRAW: ${luckyIds.length} versions`)
}
