import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const filePath = 'C:\\Users\\D-LINE\\Desktop\\新しいフォルダー\\SEVENTEEN-dogyomu-700x878.jpg'
const bytes = readFileSync(filePath)
const fileName = `spot_photos/SP00122_${Date.now()}.jpg`

const { error: upErr } = await s.storage.from('event-images').upload(fileName, bytes, {
  contentType: 'image/jpeg',
  upsert: true,
})
if (upErr) { console.error(upErr); process.exit(1) }

const { data: urlData } = s.storage.from('event-images').getPublicUrl(fileName)
const publicUrl = urlData.publicUrl
console.log('uploaded:', publicUrl)

// Update spot.image_url
const { error: e1 } = await s.from('spots').update({ image_url: publicUrl }).eq('id', 'SP00122')
if (e1) console.error('spot update err:', e1.message)
else console.log('SP00122.image_url updated')

// Update existing spot_photo (replace old broken one's image_url)
const { data: existingPhotos } = await s.from('spot_photos').select('id').eq('spot_id', 'SP00122')
if (existingPhotos?.length) {
  const { error: e2 } = await s.from('spot_photos').update({ image_url: publicUrl }).eq('id', existingPhotos[0].id)
  if (e2) console.error('photo update err:', e2.message)
  else console.log(`spot_photos[${existingPhotos[0].id}].image_url updated`)
}

const { data: verify } = await s.from('spots').select('id, spot_name, image_url').eq('id', 'SP00122').maybeSingle()
console.log('\nverify:', verify)
