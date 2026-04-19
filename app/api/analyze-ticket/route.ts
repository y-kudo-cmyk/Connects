import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '')

export async function POST(req: NextRequest) {
  // 認証必須（Gemini コスト保護）
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'no image' }, { status: 400 })

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      `このチケット画像から座席情報を抽出してください。
以下のJSON配列形式で返してください。見つかった情報のみを含めてください。

重要ルール:
- label は必ず日本語で返すこと（チケットが英語でも日本語に翻訳）
  * Section / Area → エリア
  * Stand → スタンド
  * Block → ブロック
  * Row / Line → 列
  * Seat / Seat No → 座席番号
  * Gate / Entrance → ゲート
  * Zone → ゾーン
  * Floor → フロア
  * Level → レベル
  * 公演日 / Date → 日時
- value は数字や英数字はチケット通りのままでOK
- 「Seat」「Section」のような英語ラベルは絶対に使わない
- 見出しだけ拾って値が空のものは返さない

形式:
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
