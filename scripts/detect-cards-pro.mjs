// Gemini 2.5 Pro でカード位置を正確に検出
import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)

const IMG = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011.png'
const buf = readFileSync(IMG)
const meta = await sharp(buf).metadata()
const W = meta.width, H = meta.height

// Gemini spatial understanding works best with box_2d normalized [y0, x0, y1, x1] in 0-1000
// See https://ai.google.dev/gemini-api/docs/bounding-boxes
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
  generationConfig: { responseMimeType: 'application/json', temperature: 0 },
})

const prompt = `Detect every rectangular trading card (photocard / binder / QR card) in this image.
Return each card's bounding box as box_2d [ymin, xmin, ymax, xmax] normalized to 0-1000 (y first, then x).
Crop the card rectangle tightly - no surrounding whitespace or labels.

Label each card with its section and position. The image has these sections top to bottom:
1. STANDARD: row of 4 photocards (HERE_1, HERE_2, HEAR_1, HEAR_2 left to right)
2. DEAR ver.: row of 5 items (DEAR_binder, DEAR_pc1, DEAR_pc2, DEAR_pc3, DEAR_pc4 left to right)
3. WEVERSE ALBUM ver.: row of 3 items (WEVERSE_qr, WEVERSE_pc1, WEVERSE_pc2 left to right)
4. KiT ver.: 1 photocard centered (KIT_pc1)

Output strict JSON:
[{"label": "HERE_1", "box_2d": [ymin, xmin, ymax, xmax]}, ...]
13 entries total.`

console.log('Calling Gemini 2.5 Pro...')
const result = await model.generateContent([
  { inlineData: { data: buf.toString('base64'), mimeType: 'image/png' } },
  prompt,
])
const text = result.response.text()
console.log('Response length:', text.length)
writeFileSync('C:\\Users\\D-LINE\\connects-plus\\scripts\\_pilot_scan2\\_pro.json', text)

const detections = JSON.parse(text)
console.log(`Detected ${detections.length} cards:`)
for (const d of detections) {
  const [ymin, xmin, ymax, xmax] = d.box_2d
  const left = Math.round(xmin / 1000 * W)
  const top = Math.round(ymin / 1000 * H)
  const width = Math.round((xmax - xmin) / 1000 * W)
  const height = Math.round((ymax - ymin) / 1000 * H)
  console.log(`  ${d.label.padEnd(15)} px (${left},${top}) ${width}x${height}`)
}
