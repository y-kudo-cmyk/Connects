import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { error } = await s.from('spots').update({ memo: '' }).eq('id', 'SP00275')
if (error) console.error(error)
else console.log('SP00275 memo cleared')

const { data } = await s.from('spots').select('id, spot_name, memo').eq('id', 'SP00275').maybeSingle()
console.log('verify:', data)
