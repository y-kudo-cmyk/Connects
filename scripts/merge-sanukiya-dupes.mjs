import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Keep: SP00275 (さぬき家, has original_submitter_email=ayaka.24.ysm, correct Glide attribution)
// Delete: SP00357 (Sanukiya, duplicate)
const KEEP = 'SP00275'
const DROP = 'SP00357'

// Move any photos from DROP → KEEP
const { data: dropPhotos } = await s.from('spot_photos').select('*').eq('spot_id', DROP)
console.log(`photos on ${DROP}: ${dropPhotos.length}`)
for (const p of dropPhotos || []) {
  const { error } = await s.from('spot_photos').update({ spot_id: KEEP }).eq('id', p.id)
  if (error) console.error('move:', error.message)
  else console.log(`moved photo ${p.id} to ${KEEP}`)
}

// Move any favorite_spots
const { error: favErr } = await s.from('favorite_spots').update({ spot_id: KEEP }).eq('spot_id', DROP)
if (favErr) console.error('favorites:', favErr.message)

// Delete DROP
const { error: delErr } = await s.from('spots').delete().eq('id', DROP)
if (delErr) console.error('delete:', delErr.message)
else console.log(`deleted spot ${DROP}`)

// Verify
const { data: check } = await s.from('spots').select('*').or(`id.eq.${KEEP},id.eq.${DROP}`)
console.log('\nafter:')
for (const sp of check) console.log(`  ${sp.id} | ${sp.spot_name} | submitted_by=${sp.submitted_by}`)
