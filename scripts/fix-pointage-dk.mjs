import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// SP00122 ポワンタージュ: DINO → DK
const { error: e1 } = await s.from('spots').update({
  related_artists: '#SEVENTEEN #DK',
  memo: 'DK',
}).eq('id', 'SP00122')
if (e1) console.error(e1)
else console.log('SP00122 updated: related_artists → #SEVENTEEN #DK')

// photo tags
const { error: e2 } = await s.from('spot_photos').update({ tags: '#SEVENTEEN #DK' }).eq('spot_id', 'SP00122')
if (e2) console.error(e2)
else console.log('spot_photos.tags updated')

const { data } = await s.from('spots').select('id, spot_name, related_artists, memo').eq('id', 'SP00122').maybeSingle()
console.log('verify:', data)
