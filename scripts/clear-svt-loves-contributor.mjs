import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: matches } = await s.from('spot_photos').select('id, spot_id').eq('contributor', '@svt_loves___')
console.log(`matches: ${matches.length}`)
const { error, count } = await s.from('spot_photos').update({ contributor: '' }, { count: 'exact' }).eq('contributor', '@svt_loves___')
if (error) console.error(error)
else console.log(`cleared contributor on ${count} photos`)

// Verify
const { count: remaining } = await s.from('spot_photos').select('*', { count: 'exact', head: true }).eq('contributor', '@svt_loves___')
console.log(`remaining: ${remaining}`)
