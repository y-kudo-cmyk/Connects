import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const ID = 'SP00323'
await s.from('spot_photos').delete().eq('spot_id', ID)
await s.from('favorite_spots').delete().eq('spot_id', ID)
const { error } = await s.from('spots').delete().eq('id', ID)
if (error) console.error(error)
else console.log(`deleted ${ID}`)
