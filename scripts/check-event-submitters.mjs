import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// events
const { data: events } = await s.from('events').select('submitted_by')
const eventsCounts = new Map()
for (const r of events) eventsCounts.set(r.submitted_by || '(null)', (eventsCounts.get(r.submitted_by || '(null)') || 0) + 1)
console.log('events submitters:')
for (const [k, v] of [...eventsCounts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`)

// spots
const { data: spots } = await s.from('spots').select('submitted_by')
const spotsCounts = new Map()
for (const r of spots) spotsCounts.set(r.submitted_by || '(null)', (spotsCounts.get(r.submitted_by || '(null)') || 0) + 1)
console.log('\nspots submitters:')
for (const [k, v] of [...spotsCounts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`)

// spot_photos
const { data: ph } = await s.from('spot_photos').select('submitted_by')
const phCounts = new Map()
for (const r of ph) phCounts.set(r.submitted_by || '(null)', (phCounts.get(r.submitted_by || '(null)') || 0) + 1)
console.log('\nspot_photos submitters:')
for (const [k, v] of [...phCounts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`)
