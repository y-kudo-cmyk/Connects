import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await s.from('spots').select('id, spot_name, spot_address, artist_id, related_artists, submitted_by, source_url, memo, created_at, status').or('spot_name.ilike.%さぬき%,spot_name.ilike.%讃岐%,memo.ilike.%さぬき%')
console.log(`matches: ${data?.length || 0}`)
for (const sp of data || []) {
  console.log(JSON.stringify(sp, null, 2))
}

// also search broader
console.log('\n=== recent spots ===')
const { data: recent } = await s.from('spots').select('id, spot_name, artist_id, related_artists, submitted_by, source_url, created_at').order('created_at', { ascending: false }).limit(20)
for (const sp of recent || []) console.log(`${sp.created_at.slice(0,10)} | by=${sp.submitted_by} | artist=${sp.artist_id} | related=${sp.related_artists} | ${sp.spot_name}`)
