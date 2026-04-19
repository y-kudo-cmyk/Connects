import sharp from 'sharp'
import { readFileSync } from 'node:fs'
const buf = readFileSync('C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\sector17\\P_KR017_A000011.jpg')
console.log(await sharp(buf).metadata())
