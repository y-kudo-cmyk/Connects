import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const YKUDO = '65ba4bc6-917d-4689-aeaf-8d4b5b01a004'
const { data } = await s.from('user_dismissals').select('*').eq('user_id', YKUDO)
console.log('y-kudo dismissed count:', data?.length)
for (const d of data || []) console.log(` type=${d.type} target=${d.target_id}`)
