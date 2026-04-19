// DEAR 行を 1 card 分ずつ様々な x 位置で切り出して最適位置を探る
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import sharp from 'sharp'

const IMG = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011.png'
const OUT = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_pilot_scan'
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const buf = readFileSync(IMG)

// DEAR row: y=1280-1700 前後, 各カード幅 ~260-280, 5 cards
// 全幅 2481 のうち、カード5枚 + 6個の隙間で割ると:
// (2481 - 5 * cardWidth) / 6 = gap. cardWidth=260 → gap = 198 per side+between
// より正確には cards are centered around middle 1240 (image center x=1240)

// Test each card with width 250 at 5 candidate x positions:
const ROW_Y = 1290
const ROW_H = 400

// Let's find each card's LEFT edge by scanning: try x = 300, 320, 340, 360, 380, 400
// For each, crop the next 250 pixels and see if we get a clean card
for (let x = 300; x <= 420; x += 20) {
  await sharp(buf).extract({ left: x, top: ROW_Y, width: 250, height: ROW_H })
    .webp().toFile(`${OUT}\\card1_x${x}.webp`)
}
// Card 2 expected around 680
for (let x = 600; x <= 720; x += 20) {
  await sharp(buf).extract({ left: x, top: ROW_Y, width: 250, height: ROW_H })
    .webp().toFile(`${OUT}\\card2_x${x}.webp`)
}
// Card 3
for (let x = 920; x <= 1040; x += 20) {
  await sharp(buf).extract({ left: x, top: ROW_Y, width: 250, height: ROW_H })
    .webp().toFile(`${OUT}\\card3_x${x}.webp`)
}
// Card 4
for (let x = 1240; x <= 1360; x += 20) {
  await sharp(buf).extract({ left: x, top: ROW_Y, width: 250, height: ROW_H })
    .webp().toFile(`${OUT}\\card4_x${x}.webp`)
}
// Card 5
for (let x = 1560; x <= 1680; x += 20) {
  await sharp(buf).extract({ left: x, top: ROW_Y, width: 250, height: ROW_H })
    .webp().toFile(`${OUT}\\card5_x${x}.webp`)
}

console.log('Done. Inspect _pilot_scan/ folder')
