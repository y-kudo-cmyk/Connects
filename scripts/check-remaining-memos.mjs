import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await s.from('spots').select('id, spot_name, memo').or('memo.ilike.%[인스%,memo.ilike.%SVT Record%,memo.ilike.%instagram story%')
for (const sp of data) console.log(`  ${sp.id} | ${sp.spot_name} | memo="${sp.memo}"`)
