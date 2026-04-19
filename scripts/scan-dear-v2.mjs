// より狭い幅 (200) で各カード位置を精密スキャン
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import sharp from 'sharp'

const IMG = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011.png'
const OUT = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_pilot_scan2'
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const buf = readFileSync(IMG)
const ROW_Y = 1290
const ROW_H = 400
const W = 220

// 各カードの左端候補を試す
const tests = [
  { name: 'c1', xs: [380, 400, 420, 440] },
  { name: 'c2', xs: [700, 720, 740, 760] },
  { name: 'c3', xs: [1020, 1040, 1060, 1080] },
  { name: 'c4', xs: [1340, 1360, 1380, 1400] },
  { name: 'c5', xs: [1660, 1680, 1700, 1720] },
]
for (const t of tests) {
  for (const x of t.xs) {
    await sharp(buf).extract({ left: x, top: ROW_Y, width: W, height: ROW_H })
      .webp().toFile(`${OUT}\\${t.name}_x${x}_w${W}.webp`)
  }
}
console.log(`Done. ${OUT}`)
