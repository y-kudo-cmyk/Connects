import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Clear all non-empty contributor values
const { count, error } = await s.from('spot_photos').update({ contributor: '' }, { count: 'exact' }).neq('contributor', '')
if (error) console.error(error)
else console.log(`cleared ${count} photo contributors`)

// Verify
const { data: remaining } = await s.from('spot_photos').select('contributor').not('contributor', 'is', null).neq('contributor', '')
console.log(`remaining non-empty: ${remaining.length}`)
