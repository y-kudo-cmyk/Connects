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

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    })

    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      `SEVENTEEN のコンサートチケット画像から、そのチケット1枚分の座席情報を抽出してください。

必須ルール:
1. このチケット1枚の座席情報のみ抽出する（他の席や座席表の一覧は拾わない）
2. 返すのは JSON 配列のみ、余計なテキスト禁止
3. label は必ず日本語のみ。英単語は翻訳する:
   Seat / Seat No / Seat Number → 座席番号
   Section / Area / Sector → エリア
   Zone → ゾーン
   Stand → スタンド
   Block → ブロック
   Row / Line → 列
   Gate / Entrance → ゲート
   Floor / Level → フロア
   Date → 日時
4. value は実際の値のみ（"Seat A1" ではなく "A1"）
5. 値が空や "N/A" の項目は含めない
6. 同じラベルを複数回返さない（最も具体的な1つだけ）
7. アリーナ席/スタンド席など「席種」は label="席種" にする

出力例（この形式の JSON 配列だけ返す）:
[
  {"label": "席種", "value": "アリーナ"},
  {"label": "ブロック", "value": "A12"},
  {"label": "列", "value": "3"},
  {"label": "座席番号", "value": "15"},
  {"label": "ゲート", "value": "北2"}
]`,
    ])

    const text = result.response.text()
    console.log('[analyze-ticket] raw Gemini response:', text.slice(0, 500))
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn('[analyze-ticket] no JSON array in response')
      return NextResponse.json({ fields: [] })
    }

    // Gemini が英語ラベルを返した場合のセーフティネット (長いフレーズから先にマッチ)
    const LABEL_TRANSLATIONS: [string, string][] = [
      ['seat number', '座席番号'], ['seat no', '座席番号'], ['seat no.', '座席番号'],
      ['event date', '日時'], ['show date', '日時'],
      ['venue name', '会場'],
      ['section', 'エリア'], ['sector', 'エリア'], ['area', 'エリア'],
      ['stand', 'スタンド'],
      ['block', 'ブロック'],
      ['gate', 'ゲート'], ['entrance', 'ゲート'],
      ['row', '列'], ['line', '列'], ['column', '列'],
      ['zone', 'ゾーン'],
      ['floor', 'フロア'], ['level', 'レベル'],
      ['date', '日時'], ['venue', '会場'],
      ['seat', '座席番号'],
    ]
    function translateLabel(label: string): string {
      const clean = label.trim().toLowerCase()
      for (const [en, ja] of LABEL_TRANSLATIONS) {
        if (clean === en || clean.includes(en)) return ja
      }
      return label
    }

    type Field = { label: string; value: string }
    let rawFields: Field[]
    try {
      rawFields = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      console.error('[analyze-ticket] JSON parse error:', parseErr)
      return NextResponse.json({ fields: [] })
    }

    // Dedupe by label (keep first non-empty value)
    const seen = new Set<string>()
    const fields: Field[] = []
    for (const f of rawFields) {
      if (!f || typeof f.label !== 'string' || typeof f.value !== 'string') continue
      const val = f.value.trim()
      if (!val || val.toLowerCase() === 'n/a') continue
      const label = translateLabel(f.label)
      if (seen.has(label)) continue
      seen.add(label)
      fields.push({ label, value: val })
    }
    console.log(`[analyze-ticket] extracted ${fields.length} fields`)
    return NextResponse.json({ fields })
  } catch (e) {
    console.error('analyze-ticket error:', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
