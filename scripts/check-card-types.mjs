import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await s.from('card_master').select('card_type').limit(5000)
const counts = new Map()
for (const row of data) counts.set(row.card_type || '(null)', (counts.get(row.card_type || '(null)') || 0) + 1)
console.log('card_type distribution:')
for (const [k, v] of [...counts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`)
