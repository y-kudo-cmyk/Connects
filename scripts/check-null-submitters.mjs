import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await s.from('spots').select('id, spot_name, submitted_by, source_url, created_at').is('submitted_by', null)
console.log(`null submitter spots: ${data.length}`)
for (const sp of data) console.log(`  ${sp.id} | ${sp.spot_name} | source=${sp.source_url || '-'} | created=${sp.created_at.slice(0,10)}`)

// also check spot_photos contributor, get unique contributor values
console.log('\n=== unique spot_photos contributors ===')
const { data: ph } = await s.from('spot_photos').select('contributor, spot_id').not('contributor', 'is', null).neq('contributor', '')
const byContrib = new Map()
for (const p of ph) {
  if (!byContrib.has(p.contributor)) byContrib.set(p.contributor, new Set())
  byContrib.get(p.contributor).add(p.spot_id)
}
for (const [k, spotSet] of [...byContrib.entries()].sort((a, b) => b[1].size - a[1].size)) {
  console.log(`  ${k}: ${spotSet.size} spots`)
}
