// PILOT v2: Gemini に normalized coords (0-1000) で頼む (Google 推奨形式)
import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import sharp from 'sharp'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)

const IMG_PATH = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011.png'
const OUT_DIR = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_pilot_v2'
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

const imgBuf = readFileSync(IMG_PATH)
const meta = await sharp(imgBuf).metadata()
const W = meta.width, H = meta.height
console.log(`Image: ${W}x${H}`)

// Use Gemini 2.5 Pro for better spatial accuracy
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',  // try flash first; switch to pro if needed
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0,
  },
})

const prompt = `SEVENTEEN のアルバム「17 IS RIGHT HERE」メンバー (SEUNGKWAN) の封入トレカ一覧シート。

画像中の各トレカの 2D バウンディングボックスを検出してください。
出力は Gemini Spatial Understanding 形式で、[ymin, xmin, ymax, xmax] 各 0-1000 のnormalized 座標。
トレカ本体の矩形 (ラベル文字や余白は除く) を厳密に囲ってください。

セクション:
1. "STANDARD": 上段左から HERE Photocard 1, HERE Photocard 2, HEAR Photocard 1, HEAR Photocard 2 (計4枚、横一列)
2. "DEAR ver.": Binder 1枚 + Photocard 1〜4 (計5枚、横一列、Binder は左端)
3. "WEVERSE ALBUM ver.": QR 1枚 + Photocard 1〜2 (計3枚、横一列)
4. "KiT ver.": Photocard 1 (1枚のみ、中央)

JSON 配列:
[
  {"label": "HERE_photocard_1", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "HERE_photocard_2", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "HEAR_photocard_1", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "HEAR_photocard_2", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "DEAR_binder", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "DEAR_photocard_1", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "DEAR_photocard_2", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "DEAR_photocard_3", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "DEAR_photocard_4", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "WEVERSE_qr", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "WEVERSE_photocard_1", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "WEVERSE_photocard_2", "box_2d": [ymin, xmin, ymax, xmax]},
  {"label": "KIT_photocard_1", "box_2d": [ymin, xmin, ymax, xmax]}
]`

const result = await model.generateContent([
  { inlineData: { data: imgBuf.toString('base64'), mimeType: 'image/png' } },
  prompt,
])
const text = result.response.text()
writeFileSync(`${OUT_DIR}\\_raw.json`, text)
console.log('Gemini returned', text.length, 'chars')

const detections = JSON.parse(text)
console.log(`Detected ${detections.length} items`)
for (const d of detections) {
  const [ymin, xmin, ymax, xmax] = d.box_2d
  const left = Math.round(xmin / 1000 * W)
  const top = Math.round(ymin / 1000 * H)
  const width = Math.round((xmax - xmin) / 1000 * W)
  const height = Math.round((ymax - ymin) / 1000 * H)
  console.log(`  ${d.label}: box=${d.box_2d.join(',')} → px (${left},${top}) ${width}x${height}`)

  try {
    const cropped = await sharp(imgBuf)
      .extract({ left, top, width, height })
      .webp({ quality: 90 })
      .toFile(`${OUT_DIR}\\${d.label}.webp`)
  } catch (e) {
    console.error(`    crop failed: ${e.message}`)
  }
}

console.log(`\nDone. Check ${OUT_DIR}/`)
