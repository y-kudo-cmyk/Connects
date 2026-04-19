import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const SRC = 'C:\\Users\\D-LINE\\Desktop\\新しいフォルダー\\images (1).jfif'
const buf = readFileSync(SRC)
const webp = await sharp(buf).webp({ quality: 85 }).toBuffer()

const path = `tour-posters/caratland-7th-2023.webp`
const { error: upErr } = await s.storage.from('event-images').upload(path, webp, { contentType: 'image/webp', upsert: true })
if (upErr) { console.error(upErr); process.exit(1) }
const { data } = s.storage.from('event-images').getPublicUrl(path)
const url = data.publicUrl
console.log('Uploaded:', url)

const { error: updErr } = await s.from('card_products').update({ image_url: url }).eq('product_id', 'P_CON_CARATLAND_7')
if (updErr) console.error(updErr)
else console.log('✓ P_CON_CARATLAND_7.image_url updated')
