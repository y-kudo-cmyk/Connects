// Concert/Event テンプレベースのバッチ処理
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TEMPLATE_PATH = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_album_templates\\P_CON_HANABI.json'
const REFS_DIR = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\hanabi'
const VERSION_ID = 'V_CON_HANABI_01'

const template = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8'))
const memberFiles = readdirSync(REFS_DIR).filter(f => /^P_CON_HANABI_A\d+\.jpg$/.test(f))
console.log(`Found ${memberFiles.length} member images`)

for (const file of memberFiles) {
  const fullMid = file.match(/_(A\d{6})\.jpg$/)[1]
  console.log(`\n== ${fullMid} ==`)
  const buf = readFileSync(`${REFS_DIR}\\${file}`)

  for (let i = 0; i < template.cards.length; i++) {
    const card = template.cards[i]
    const masterId = `CM_CON_HANABI_${fullMid}_${i + 1}`

    const { data: row } = await s.from('card_master').select('id, front_image_url').eq('id', masterId).maybeSingle()
    if (!row) { console.log(`  skip ${masterId}: not found`); continue }
    if (row.front_image_url) { console.log(`  skip ${masterId}: already has image`); continue }

    try {
      const cropped = await sharp(buf).extract({ left: card.left, top: card.top, width: card.width, height: card.height }).toBuffer()
      const { width: cw, height: ch } = await sharp(cropped).metadata()
      const whiteLayer = await sharp({ create: { width: cw, height: ch, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.3 } } }).png().toBuffer()
      const finalBuf = await sharp(cropped).composite([{ input: whiteLayer, blend: 'over' }]).webp({ quality: 85 }).toBuffer()

      const { error: upErr } = await s.storage.from('card-images').upload(`masters/${masterId}.webp`, finalBuf, { contentType: 'image/webp', upsert: true })
      if (upErr) { console.error(`  upload err ${masterId}: ${upErr.message}`); continue }
      const { data: urlData } = s.storage.from('card-images').getPublicUrl(`masters/${masterId}.webp`)
      const publicUrl = urlData.publicUrl + `?v=${Date.now()}`

      const { error: updErr } = await s.from('card_master').update({ front_image_url: publicUrl }).eq('id', masterId)
      if (updErr) { console.error(`  db err ${masterId}: ${updErr.message}`); continue }
      console.log(`  ✓ ${masterId}`)
    } catch (e) {
      console.error(`  err ${masterId}: ${e.message}`)
    }
  }
}
console.log('\nDone.')
