// テンプレート座標でクロップ → 結果確認用
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import sharp from 'sharp'

const IMG_PATH = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011.png'
const TEMPLATE_PATH = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_album_templates\\P_KR021.json'
const OUT_DIR = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_pilot_v3'
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

const imgBuf = readFileSync(IMG_PATH)
const template = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8'))

for (const card of template.cards) {
  const name = `${card.version}_${card.cardType}_${card.detail.replace(/\s+/g, '_')}`
  try {
    await sharp(imgBuf)
      .extract({ left: card.left, top: card.top, width: card.width, height: card.height })
      .webp({ quality: 90 })
      .toFile(`${OUT_DIR}\\${name}.webp`)
    console.log(`✓ ${name}`)
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`)
  }
}
