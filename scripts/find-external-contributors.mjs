import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// unique contributor values
const { data: ph } = await s.from('spot_photos').select('id, spot_id, contributor').not('contributor', 'is', null).neq('contributor', '')
const counts = new Map()
for (const p of ph) counts.set(p.contributor, (counts.get(p.contributor) || 0) + 1)
console.log('=== spot_photos.contributor distribution ===')
for (const [k, v] of [...counts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  "${k}": ${v}`)

// also check spots.memo for @usernames
console.log('\n=== spots.memo containing @ ===')
const { data: spotsWithAt } = await s.from('spots').select('id, spot_name, memo').ilike('memo', '%@%').limit(50)
for (const sp of spotsWithAt) console.log(`  ${sp.id} | ${sp.spot_name} | memo="${sp.memo}"`)

// spots.related_artists with weird values
console.log('\n=== spots.source_url containing x.com ===')
const { data: xSources } = await s.from('spots').select('id, spot_name, source_url').ilike('source_url', '%svt_loves%')
console.log(`  svt_loves in source_url: ${xSources.length}`)
for (const sp of xSources.slice(0, 20)) console.log(`    ${sp.id} | ${sp.spot_name}`)

// spot_photos.source_url
const { data: phSources } = await s.from('spot_photos').select('id, spot_id, source_url').ilike('source_url', '%svt_loves%')
console.log(`\n  svt_loves in spot_photos.source_url: ${phSources.length}`)
