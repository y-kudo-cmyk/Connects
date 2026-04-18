import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'

// events: null submitter → YUTA
const { data: ev, error: evErr, count: evCount } = await s.from('events').update({ submitted_by: YUTA }, { count: 'exact' }).is('submitted_by', null).select('id')
if (evErr) console.error('events err:', evErr.message)
else console.log(`events claimed: ${evCount}`)

// spot_photos: null submitter → YUTA (only photos, NOT the spots we just set null with original_submitter_email)
const { error: phErr, count: phCount } = await s.from('spot_photos').update({ submitted_by: YUTA }, { count: 'exact' }).is('submitted_by', null).select('id')
if (phErr) console.error('photos err:', phErr.message)
else console.log(`spot_photos claimed: ${phCount}`)

// verify
const { data: e2 } = await s.from('events').select('submitted_by')
const em = new Map()
for (const r of e2) em.set(r.submitted_by || '(null)', (em.get(r.submitted_by || '(null)') || 0) + 1)
console.log('\nafter - events:')
for (const [k, v] of [...em.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`)

const { data: p2 } = await s.from('spot_photos').select('submitted_by')
const pm = new Map()
for (const r of p2) pm.set(r.submitted_by || '(null)', (pm.get(r.submitted_by || '(null)') || 0) + 1)
console.log('\nafter - spot_photos:')
for (const [k, v] of [...pm.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`)
