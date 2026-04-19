import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// photos with non-empty contributor
const { data: photos } = await s.from('spot_photos').select('spot_id, contributor, source_url').not('contributor', 'is', null).neq('contributor', '')
console.log(`photos with contributor: ${photos.length}`)
for (const p of photos) console.log(`  ${p.spot_id} | contrib="${p.contributor}" | source=${p.source_url || '-'}`)

// spots submitted_by NOT YUTA (non-admin real users)
console.log('\n=== spots with non-YUTA submitted_by ===')
const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
const { data: spots } = await s.from('spots').select('id, spot_name, submitted_by, created_at').neq('submitted_by', YUTA).not('submitted_by', 'is', null).limit(50)
console.log(`spots: ${spots.length}`)
for (const sp of spots) console.log(`  ${sp.id} | by=${sp.submitted_by} | ${sp.spot_name}`)

// Distinct submitted_by values in spots
console.log('\n=== distinct submitters (count) ===')
const { data: all } = await s.from('spots').select('submitted_by')
const counts = new Map()
for (const r of all) counts.set(r.submitted_by || '(null)', (counts.get(r.submitted_by || '(null)') || 0) + 1)
for (const [k, v] of [...counts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`)
