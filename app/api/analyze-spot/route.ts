import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `あなたはSEVENTEENのファンが作成した「聖地マップ」の画像を解析するアシスタントです。
画像からスポット（店舗・会場・場所）の情報を抽出し、必ずJSON形式のみで返してください。
説明文・前置き・マークダウンは一切不要です。JSONオブジェクトのみ出力してください。`

const USER_PROMPT = `この画像からK-POPアイドルSEVENTEENゆかりのスポット情報を全て抽出してください。

以下のJSON形式で返してください：
{
  "spots": [
    {
      "name": "日本語での店名・場所名（わからなければ現地語のまま）",
      "nameLocal": "現地語（韓国語または日本語）での正式名称",
      "address": "現地語での住所（できるだけ詳細に）",
      "city": "Seoul または Tokyo または Osaka または Other",
      "genre": "cafe または restaurant または fashion または entertainment または music または other",
      "members": ["関連SEVENTEENメンバー名（英語）"],
      "description": "このスポットとSEVENTEENの関連性",
      "lat": null,
      "lng": null,
      "officialUrl": null,
      "sourceUrl": null,
      "sourceName": null
    }
  ]
}

利用可能なメンバー名: S.Coups, Jeonghan, Joshua, Jun, Hoshi, Wonwoo, Woozi, DK, Mingyu, The8, Seungkwan, Vernon, Dino
genreは内容から推測して選んでください。
情報が不明な項目はnullにしてください。`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY が設定されていません。.env.local に追加してください。' },
      { status: 503 }
    )
  }

  try {
    const { imageBase64, mediaType = 'image/jpeg' } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: '画像データがありません' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                data: imageBase64,
              },
            },
            { type: 'text', text: USER_PROMPT },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // JSON部分だけ抽出（```json ... ``` などに包まれていた場合も対応）
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
