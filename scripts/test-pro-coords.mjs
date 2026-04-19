// Gemini Pro の座標でクロップしてみる
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import sharp from 'sharp'

const IMG = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011.png'
const OUT = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_pilot_pro'
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const buf = readFileSync(IMG)

const coords = [
  { label: 'HERE_1',      left: 615,  top: 589,  width: 293, height: 453 },
  { label: 'HERE_2',      left: 920,  top: 589,  width: 293, height: 453 },
  { label: 'HEAR_1',      left: 1265, top: 589,  width: 293, height: 453 },
  { label: 'HEAR_2',      left: 1570, top: 589,  width: 293, height: 453 },
  { label: 'DEAR_binder', left: 424,  top: 1277, width: 350, height: 453 },
  { label: 'DEAR_pc1',    left: 846,  top: 1277, width: 293, height: 453 },
  { label: 'DEAR_pc2',    left: 1151, top: 1277, width: 293, height: 453 },
  { label: 'DEAR_pc3',    left: 1456, top: 1277, width: 293, height: 453 },
  { label: 'DEAR_pc4',    left: 1762, top: 1277, width: 293, height: 453 },
  { label: 'WEVERSE_qr',  left: 839,  top: 1968, width: 261, height: 403 },
  { label: 'WEVERSE_pc1', left: 1109, top: 1968, width: 261, height: 403 },
  { label: 'WEVERSE_pc2', left: 1379, top: 1968, width: 261, height: 403 },
  { label: 'KIT_pc1',     left: 1109, top: 2610, width: 261, height: 400 },
]
for (const c of coords) {
  await sharp(buf).extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .webp({ quality: 90 }).toFile(`${OUT}\\${c.label}.webp`)
  console.log(`✓ ${c.label}`)
}
