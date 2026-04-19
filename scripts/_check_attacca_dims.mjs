import sharp from 'sharp'
import { readdirSync, readFileSync } from 'node:fs'
const dir = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\attacca'
for (const f of readdirSync(dir).filter(f => f.endsWith('.jpg'))) {
  const m = await sharp(readFileSync(`${dir}\\${f}`)).metadata()
  console.log(f, m.width + 'x' + m.height)
}
