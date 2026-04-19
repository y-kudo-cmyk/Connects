// 画像にグリッド線を描画して座標特定用の参考画像を生成
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const IMG_PATH = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011.png'
const OUT_PATH = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011_grid.png'

const imgBuf = readFileSync(IMG_PATH)
const meta = await sharp(imgBuf).metadata()
const W = meta.width, H = meta.height
console.log(`Image: ${W}x${H}`)

// 100px ごとにグリッド + 500px ごとに太線、ラベル付き
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .lmajor { stroke: red; stroke-width: 3; opacity: 0.6; fill: none; }
    .lminor { stroke: blue; stroke-width: 1; opacity: 0.4; fill: none; }
    .label { fill: red; font-size: 30px; font-weight: bold; font-family: sans-serif; }
  </style>
  ${(() => {
    let lines = ''
    for (let x = 0; x <= W; x += 100) {
      const cls = x % 500 === 0 ? 'lmajor' : 'lminor'
      lines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" class="${cls}"/>`
      if (x % 500 === 0) lines += `<text x="${x + 4}" y="32" class="label">${x}</text>`
    }
    for (let y = 0; y <= H; y += 100) {
      const cls = y % 500 === 0 ? 'lmajor' : 'lminor'
      lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" class="${cls}"/>`
      if (y % 500 === 0) lines += `<text x="4" y="${y - 4}" class="label">${y}</text>`
    }
    return lines
  })()}
</svg>`

await sharp(imgBuf)
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .png({ quality: 80 })
  .toFile(OUT_PATH)
console.log(`Saved grid overlay: ${OUT_PATH}`)
