// HANABI シートの9枚 (+ 1 グループ) をGemini Pro で検出
import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)

const IMG = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\hanabi\\P_CON_HANABI_A000011.jpg'
const buf = readFileSync(IMG)
const meta = await sharp(buf).metadata()
console.log(`Image: ${meta.width}x${meta.height}`)

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro', generationConfig: { responseMimeType: 'application/json', temperature: 0 }})
const result = await model.generateContent([
  { inlineData: { data: buf.toString('base64'), mimeType: 'image/jpeg' } },
  `この画像は SEVENTEEN 2022 JAPAN FANMEETING HANABI のトレカ一覧シート (SEUNGKWAN ver.)。
各トレカの2Dバウンディングボックスを検出: [ymin, xmin, ymax, xmax] normalized to 0-1000.
カード本体の矩形のみ (上の番号ラベル011-105は除外、周囲の余白も除外)。

構成:
- 上段: 5枚 (番号011, 024, 037, 050, 063 左から右)
- 下段: 4枚 + グループ写真 (番号076, 089, 102, 105, group 左から右)

JSON 配列:
[
  {"label": "photocard_011", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "photocard_024", "box_2d": [...]},
  ...
  {"label": "group", "box_2d": [...]}
]
10件。`,
])
console.log(result.response.text())
