// 元画像にテンプレート矩形をオーバーレイして確認
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const IMG_PATH = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011.png'
const TEMPLATE_PATH = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_album_templates\\P_KR021.json'
const OUT_PATH = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011_preview.png'

const imgBuf = readFileSync(IMG_PATH)
const template = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf8'))
const { width: W, height: H } = template.imageSize

const rects = template.cards.map((c, i) => `
  <rect x="${c.left}" y="${c.top}" width="${c.width}" height="${c.height}"
    fill="none" stroke="red" stroke-width="6" opacity="0.7"/>
  <text x="${c.left + 10}" y="${c.top + 40}" fill="red" font-size="28" font-weight="bold" font-family="sans-serif">
    ${i + 1}. ${c.version}_${c.cardType}
  </text>
`).join('')

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`
await sharp(imgBuf)
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .png()
  .toFile(OUT_PATH)
console.log(`Saved: ${OUT_PATH}`)
