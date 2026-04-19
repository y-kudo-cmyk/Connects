// 汎用 Gemini Pro 検出 (CLI): 1 画像の座標を取って JSON 出力
import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)

const [, , IMG_PATH, PROMPT_HINT] = process.argv
const buf = readFileSync(IMG_PATH)
const meta = await sharp(buf).metadata()
const W = meta.width, H = meta.height
console.log(`Image: ${W}x${H}`)

const mime = IMG_PATH.endsWith('.png') ? 'image/png' : 'image/jpeg'
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro', generationConfig: { responseMimeType: 'application/json', temperature: 0 } })
const result = await model.generateContent([
  { inlineData: { data: buf.toString('base64'), mimeType: mime } },
  `${PROMPT_HINT}

各トレカの box_2d [ymin, xmin, ymax, xmax] を 0-1000 normalized で検出。
番号ラベル/周囲余白は除外、カード本体のみ。

JSON 配列を返す:
[{"label": "photocard_1", "box_2d": [ymin, xmin, ymax, xmax]}, ...]`,
])
const text = result.response.text()
console.log(text)

// Convert to pixel coordinates
const dets = JSON.parse(text)
console.log('\nPixel coords:')
for (const d of dets) {
  const [y0, x0, y1, x1] = d.box_2d
  const left = Math.round(x0 / 1000 * W)
  const top = Math.round(y0 / 1000 * H)
  const width = Math.round((x1 - x0) / 1000 * W)
  const height = Math.round((y1 - y0) / 1000 * H)
  console.log(`  ${d.label}: left=${left}, top=${top}, width=${width}, height=${height}`)
}
