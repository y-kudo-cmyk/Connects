import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)

const IMG = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\bethesun_kr\\P_CON_BETHESUN_KR_A000011.jpg'
const buf = readFileSync(IMG)
const meta = await sharp(buf).metadata()
console.log(`Image: ${meta.width}x${meta.height}`)

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro', generationConfig: { responseMimeType: 'application/json', temperature: 0 } })
const result = await model.generateContent([
  { inlineData: { data: buf.toString('base64'), mimeType: 'image/jpeg' } },
  `SEVENTEEN WORLD TOUR BE THE SUN IN SEOUL の SEUNGKWAN ver. トレカ一覧シート。

構成:
- 上段: 4枚 (番号 031, 032, 032, 041 SPECIAL 左→右)
- 下段: 4枚 (番号 063, 064, 080 SPECIAL, 069 SPECIAL 左→右)
- 最後の2枚はグループ写真風 (SPECIAL)

各トレカの box_2d [ymin, xmin, ymax, xmax] を 0-1000 で検出。
番号ラベルと周囲余白は除外、カード本体のみ。

JSON:
[{"label": "photocard_1", "box_2d": [...]}, ... {"label": "photocard_8", "box_2d": [...]}]
8件。左→右、上→下の順で Photocard 1-8 と命名。`,
])
console.log(result.response.text())
