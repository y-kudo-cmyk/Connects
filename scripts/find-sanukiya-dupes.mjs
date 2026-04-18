import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await s.from('spots').select('*').or('spot_name.ilike.%さぬき%,spot_name.ilike.%sanuki%,spot_name.ilike.%Sanuki%').order('created_at')
console.log(`matches: ${data.length}`)
for (const sp of data) {
  const { count: photoCount } = await s.from('spot_photos').select('*', { count: 'exact', head: true }).eq('spot_id', sp.id)
  console.log(JSON.stringify({ id: sp.id, name: sp.spot_name, addr: sp.spot_address, lat: sp.lat, lng: sp.lng, status: sp.status, submitted_by: sp.submitted_by, original_email: sp.original_submitter_email, photos: photoCount, created: sp.created_at }, null, 2))
}
