// DEAR 行だけを切り出して確認 (細かい座標特定用)
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const IMG = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011.png'
const OUT = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_DEAR_strip.png'

const buf = readFileSync(IMG)

// DEAR section: y=1200-1900 を切り出し + グリッド
const STRIP_Y = 1200, STRIP_H = 800
const strip = await sharp(buf).extract({ left: 0, top: STRIP_Y, width: 2481, height: STRIP_H }).toBuffer()

// Add 100px grid overlay
const svg = `<svg width="2481" height="${STRIP_H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .lmaj { stroke: red; stroke-width: 4; opacity: 0.7; fill: none; }
    .lmin { stroke: blue; stroke-width: 2; opacity: 0.5; fill: none; }
    .lbl { fill: red; font-size: 36px; font-weight: bold; font-family: sans-serif; }
  </style>
  ${(() => {
    let o = ''
    for (let x = 0; x <= 2481; x += 100) {
      const cls = x % 500 === 0 ? 'lmaj' : 'lmin'
      o += `<line x1="${x}" y1="0" x2="${x}" y2="${STRIP_H}" class="${cls}"/>`
      if (x % 500 === 0) o += `<text x="${x + 4}" y="40" class="lbl">${x}</text>`
    }
    for (let y = 0; y <= STRIP_H; y += 50) {
      const cls = y % 200 === 0 ? 'lmaj' : 'lmin'
      o += `<line x1="0" y1="${y}" x2="2481" y2="${y}" class="${cls}"/>`
      if (y % 200 === 0) o += `<text x="4" y="${y + 32}" class="lbl">${STRIP_Y + y}</text>`
    }
    return o
  })()}
</svg>`

await sharp(strip).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toFile(OUT)
console.log(`Saved: ${OUT}`)
