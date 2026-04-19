// DEAR 行のクロップを保存して視覚確認
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import sharp from 'sharp'

const IMG = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011.png'
const TEMPLATE = JSON.parse(readFileSync('C:\\Users\\D-LINE\\connects-plus\\scripts\\_album_templates\\P_KR021.json', 'utf8'))
const OUT = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_pilot_v4'
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const buf = readFileSync(IMG)
const dearCards = TEMPLATE.cards.filter(c => c.version === 'DEAR')
for (const c of dearCards) {
  const name = `${c.cardType}_${c.detail.replace(/\s+/g, '_')}`
  await sharp(buf)
    .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .webp({ quality: 90 })
    .toFile(`${OUT}\\${name}.webp`)
  console.log(`✓ ${name}`)
}
