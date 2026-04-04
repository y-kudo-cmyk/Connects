import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '')

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'no image' }, { status: 400 })

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      `このチケット画像から座席情報を抽出してください。
チケットに記載されている座席に関する情報（エリア、スタンド、ゾーン、ブロック、列、席番号、ゲートなど）を見つけ、
以下のJSON配列形式で返してください。見つかった情報のみを含め、空の項目は含めないでください。

[
  { "label": "フィールド名（チケットに書いてある通りの言葉）", "value": "値" },
  ...
]

例：
[
  { "label": "スタンド", "value": "アリーナ" },
  { "label": "ブロック", "value": "A" },
  { "label": "列", "value": "3列" },
  { "label": "座席番号", "value": "15番" }
]

JSONのみ返してください。余計なテキストは不要です。`,
    ])

    const text = result.response.text()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ fields: [] })

    const fields = JSON.parse(jsonMatch[0])
    return NextResponse.json({ fields })
  } catch (e) {
    console.error('analyze-ticket error:', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
