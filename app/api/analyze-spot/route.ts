import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '')

export async function POST(req: NextRequest) {
  // 認証必須（Gemini コスト保護）
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY が設定されていません' }, { status: 503 })
  }

  try {
    const { imageBase64, mediaType = 'image/jpeg' } = await req.json()
    if (!imageBase64) {
      return NextResponse.json({ error: '画像データがありません' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType: mediaType } },
      `この画像からK-POPアイドルSEVENTEENゆかりのスポット情報を全て抽出してください。

以下のJSON形式で返してください（JSONのみ、説明不要）:
{
  "spots": [
    {
      "name": "日本語での店名・場所名",
      "nameLocal": "現地語での正式名称",
      "address": "現地語での住所（できるだけ詳細に）",
      "city": "Seoul / Tokyo / Osaka / Other",
      "genre": "cafe / restaurant / fashion / entertainment / music / other",
      "members": ["関連メンバー名"],
      "description": "スポットとSEVENTEENの関連性",
      "lat": null,
      "lng": null,
      "officialUrl": null,
      "sourceUrl": null
    }
  ]
}

メンバー名: S.COUPS, JEONGHAN, JOSHUA, JUN, HOSHI, WONWOO, WOOZI, DK, MINGYU, THE 8, SEUNGKWAN, VERNON, DINO`,
    ])

    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AIの応答からJSONを抽出できませんでした', raw: text }, { status: 422 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
