import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// spot row
const { data: spot } = await s.from('spots').select('*').eq('id', 'SP00275').maybeSingle()
console.log('spot:\n', JSON.stringify(spot, null, 2))

// photos
const { data: photos } = await s.from('spot_photos').select('*').eq('spot_id', 'SP00275')
console.log(`\nphotos: ${photos?.length || 0}`)
for (const p of photos || []) console.log(JSON.stringify(p, null, 2))

// inspect useSupabaseData to understand how members are derived
