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
      model: 'gemini-2.5-pro',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    })

    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      `日本のコンサートチケット (SEVENTEEN / K-POP公演) の画像から座席情報を OCR で抽出してください。

【厳守ルール】
1. このチケット**1枚分の座席情報のみ**。座席表の一覧や他の席は絶対に拾わない。
2. 返すのは JSON 配列のみ、余計なテキスト禁止。
3. label は日本語のみ。英語表記は以下に翻訳:
   - Seat / Seat No / Seat Number / Seat # → 座席番号
   - Section / Area / Sector / セクション → エリア
   - Stand / スタンド席 → スタンド
   - Block / ブロック → ブロック
   - Row / Line / 列番号 / Row No → 列
   - Zone / ゾーン → ゾーン
   - Gate / Entrance / Entry / 入場口 / 入口 → ゲート
   - Floor / Level / 階 → フロア
   - Date / Show Date / 公演日時 / 日付 → 日時
4. value は値のみ (ラベル文字は含めない)。例: "Seat A1" なら value="A1"
5. 値が空/N/A/-/空白のみ は含めない
6. 同じ label を複数回返さない (最も具体的な1つを選ぶ)
7. アリーナ/スタンド/バルコニー等の席種は label="席種" (例: value="アリーナ")
8. 数字に「列」「番」「席」等の単位が付いてる場合は単位付きで返す (例: "3列")
9. チケットに書かれてない情報は返さない (推測しない)

【日本語チケットによくあるパターン例】
- アリーナ 1ブロック 5列 12番
- スタンド2階 ○列 ○番
- 指定席 H列 34番
- バルコニー席 A-15

【出力JSON形式】
[
  {"label": "席種", "value": "アリーナ"},
  {"label": "ブロック", "value": "A"},
  {"label": "列", "value": "3列"},
  {"label": "座席番号", "value": "15番"},
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
