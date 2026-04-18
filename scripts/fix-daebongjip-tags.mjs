import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Find spot_photos whose tags are comma-format (no '#' but has ','). Convert to '#'-format.
const { data: all } = await s.from('spot_photos').select('id, tags')
let fixed = 0
for (const p of all) {
  if (!p.tags) continue
  if (p.tags.includes('#')) continue  // already correct
  if (!p.tags.includes(',')) continue
  // parse comma list
  const members = p.tags.split(',').map(x => x.trim()).filter(Boolean)
  if (!members.length) continue
  // rebuild hash format, ensure SEVENTEEN is first
  const normalized = ['SEVENTEEN', ...members.filter(m => m !== 'SEVENTEEN')]
  const hashed = normalized.map(m => `#${m}`).join(' ')
  await s.from('spot_photos').update({ tags: hashed }).eq('id', p.id)
  console.log(`fixed ${p.id}: "${p.tags}" → "${hashed}"`)
  fixed++
}
console.log(`\ntotal fixed: ${fixed}`)
