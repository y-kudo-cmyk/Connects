// PILOT: SEUNGKWAN × 17 IS RIGHT HERE の ALBUM.png を処理
// Gemini Vision で各トレカ位置検出 → sharp で crop → Storage upload → card_master 更新
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import sharp from 'sharp'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)

const IMG_PATH = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\P_KR021_A000011.png'
const MEMBER_ID = 'A000011'  // SEUNGKWAN
const MEMBER_NAME = 'SEUNGKWAN'
const PRODUCT_ID = 'P_KR021'

const OUT_DIR = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_pilot_crops'
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

// 1) 画像読み込み + サイズ取得
const imgBuf = readFileSync(IMG_PATH)
const meta = await sharp(imgBuf).metadata()
console.log(`Image: ${meta.width}x${meta.height}, ${(imgBuf.length / 1024 / 1024).toFixed(2)} MB`)

// 2) Gemini Vision に送ってカード位置検出
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.1,
  },
})

const prompt = `この画像は SEVENTEEN のアルバム「17 IS RIGHT HERE」のメンバー (SEUNGKWAN) の封入トレカ一覧シートです。

画像内の各トレカ（フォトカード/バインダー/QRカード）を1枚ずつ検出して、それぞれの位置をピクセル座標で返してください。

ラベルの振り方:
- "STANDARD" セクションの HERE Ver 左右2枚 → version="HERE", card_type="photocard", detail="Photocard 1" / "Photocard 2"
- "STANDARD" セクションの HEAR Ver 左右2枚 → version="HEAR", card_type="photocard", detail="Photocard 1" / "Photocard 2"
- "DEAR ver." の最初の1枚 (BINDER と書いてある) → version="DEAR", card_type="binder", detail="Binder"
- "DEAR ver." の残り4枚 → version="DEAR", card_type="photocard", detail="Photocard 1" 〜 "Photocard 4"
- "WEVERSE ALBUM ver." の各カード → version="WEVERSE", card_type="photocard" または "qr" (QR と書いてあれば), detail="Photocard 1"〜 (またはQR)
- "KiT ver." → version="KIT", card_type="photocard", detail="Photocard 1"

座標は元画像のピクセル単位で {x, y, width, height}。
トレカ周囲の白い余白は含めず、カード本体の矩形のみを指定してください。
画像サイズは ${meta.width}x${meta.height} です。

JSON 配列で返してください:
[
  {"version": "HERE", "card_type": "photocard", "detail": "Photocard 1", "x": 100, "y": 200, "width": 150, "height": 225},
  ...
]`

console.log('Calling Gemini Vision...')
const result = await model.generateContent([
  { inlineData: { data: imgBuf.toString('base64'), mimeType: 'image/png' } },
  prompt,
])
const text = result.response.text()
console.log('Gemini response:', text.slice(0, 800))

const detections = JSON.parse(text)
console.log(`\nDetected ${detections.length} cards`)
for (const d of detections) console.log(`  ${d.version} ${d.card_type} "${d.detail}" at (${d.x},${d.y}) ${d.width}x${d.height}`)

// 3) 各カードをクロップ + 70% opacity 白合成でウォーターマーク化
writeFileSync(`${OUT_DIR}\\_gemini_raw.json`, text)

for (let i = 0; i < detections.length; i++) {
  const d = detections[i]
  const outPath = `${OUT_DIR}\\${String(i + 1).padStart(2, '0')}_${d.version}_${d.card_type}_${(d.detail || '').replace(/[^a-zA-Z0-9]/g, '_')}.webp`
  try {
    // 切り出し → 半透明化 (白との合成で70% opacity風)
    const cropped = await sharp(imgBuf)
      .extract({ left: d.x, top: d.y, width: d.width, height: d.height })
      .toBuffer()
    // Add white layer (30% white overlay = 70% original visible)
    const { width: cw, height: ch } = await sharp(cropped).metadata()
    const whiteLayer = await sharp({
      create: { width: cw, height: ch, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.3 } },
    }).png().toBuffer()
    await sharp(cropped)
      .composite([{ input: whiteLayer, blend: 'over' }])
      .webp({ quality: 80 })
      .toFile(outPath)
    console.log(`  ✓ saved ${outPath}`)
  } catch (e) {
    console.error(`  ✗ ${d.detail}: ${e.message}`)
  }
}

console.log(`\nDone. Check ${OUT_DIR} for results.`)
