import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '')

// 許可されるタグ (lib/config/tags.ts と合わせる)
const ALLOWED_TAGS = new Set([
  'CONCERT',
  'TICKET',
  'CD',
  'LUCKY_DRAW',
  'POPUP',
  'MERCH',
  'RELEASE',
  'BIRTHDAY',
  'MAGAZINE',
  'EVENT',
  'TV',
  'YOUTUBE',
  'RADIO',
  'LIVEVIEWING',
  'INFO',
])

// ISO-3166 alpha-2 の運用中コード (厳格にチェックしすぎない)
const KNOWN_COUNTRIES = new Set(['JP', 'KR', 'TW', 'MO', 'CN', 'US', 'HK', 'TH', 'SG', 'PH', 'ID', 'MY', 'VN', 'AU', 'GB', 'DE', 'FR', 'CA'])

type AnalyzedEvent = {
  event_title: string
  sub_event_title: string
  start_date: string
  end_date: string | null
  start_time: string
  end_time: string
  tag: string
  country: string
  spot_name: string
  source_url: string
  image_url: string
  confidence: number
  notes: string
}

function sanitizeEvent(raw: unknown, fallbackSourceUrl: string): AnalyzedEvent | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
  const title = str(r.event_title)
  if (!title) return null

  let tag = str(r.tag).toUpperCase().replace(/\s+/g, '_')
  if (tag === 'LIVE' || tag === 'LIVE_CONCERT') tag = 'CONCERT'
  if (!ALLOWED_TAGS.has(tag)) tag = 'INFO'

  let country = str(r.country).toUpperCase()
  if (country.length !== 2) country = ''
  // KNOWN_COUNTRIES は参考。未知の 2 文字コードも許容
  if (country && !KNOWN_COUNTRIES.has(country)) {
    // 通しておく (例: HK, SG 等が既に入ってる)
  }

  const startDate = str(r.start_date)
  const dateMatch = startDate.match(/^\d{4}-\d{2}-\d{2}$/)
  const start_date = dateMatch ? startDate : ''

  const endDateRaw = str(r.end_date)
  const end_date = endDateRaw.match(/^\d{4}-\d{2}-\d{2}$/) ? endDateRaw : null

  const startTimeRaw = str(r.start_time)
  const start_time = startTimeRaw.match(/^\d{1,2}:\d{2}$/) ? startTimeRaw : ''

  const endTimeRaw = str(r.end_time)
  const end_time = endTimeRaw.match(/^\d{1,2}:\d{2}$/) ? endTimeRaw : ''

  let confidence = 0
  if (typeof r.confidence === 'number') confidence = Math.max(0, Math.min(100, Math.round(r.confidence)))
  else if (typeof r.confidence === 'string') {
    const n = parseInt(r.confidence, 10)
    if (!isNaN(n)) confidence = Math.max(0, Math.min(100, n))
  }

  return {
    event_title: title,
    sub_event_title: str(r.sub_event_title),
    start_date,
    end_date,
    start_time,
    end_time,
    tag,
    country,
    spot_name: str(r.spot_name),
    source_url: str(r.source_url) || fallbackSourceUrl,
    image_url: str(r.image_url),
    confidence,
    notes: str(r.notes),
  }
}

export async function POST(req: NextRequest) {
  // 認可: ログイン + role=fam|admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ?? null
  if (role !== 'fam' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY is not set' }, { status: 503 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    let imageBase64: string = typeof body.imageBase64 === 'string' ? body.imageBase64 : ''
    const mimeType: string = typeof body.mimeType === 'string' && body.mimeType ? body.mimeType : 'image/jpeg'
    const sourceUrl: string = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : ''
    const note: string = typeof body.note === 'string' ? body.note.trim() : ''

    if (!imageBase64) {
      return NextResponse.json({ error: 'no image' }, { status: 400 })
    }

    // data URL の場合は base64 部分だけ取り出す
    if (imageBase64.startsWith('data:')) {
      const idx = imageBase64.indexOf(',')
      if (idx >= 0) imageBase64 = imageBase64.slice(idx + 1)
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    })

    const prompt = `あなたは K-POP グループ SEVENTEEN の公式お知らせを分析するアシスタントです。
添付された画像は Weverse / 公式サイト / 運営 SNS のスクリーンショット、またはお知らせ本文です。
以下のルールで JSON を出力してください:

1. イベントごとに別オブジェクトとして抽出
2. 予約開始・先行予約・一般発売・当日公演・撤去日など別日程は別イベント
3. 複数日程公演 (例 12/5, 12/6, 12/7) は日付分だけイベント作成
4. tag は次から厳密に選択: CONCERT / TICKET / CD / LUCKY_DRAW / POPUP / MERCH / RELEASE / BIRTHDAY / MAGAZINE / EVENT / TV / YOUTUBE / RADIO / LIVEVIEWING / INFO
   - 公演本体: CONCERT
   - チケット予約/販売開始: TICKET
   - アルバム/音源発売: CD または RELEASE
   - ポップアップストア: POPUP
   - グッズ販売: MERCH
   - ライブビューイング/映画館上映: LIVEVIEWING
   - 判別不能な汎用お知らせ: INFO
5. country は ISO-3166 alpha-2 (JP/KR/TW/MO/CN/US/HK/TH/SG/PH 等)
6. 日付は YYYY-MM-DD。開始時刻は start_time=HH:MM、終了時刻は end_time=HH:MM を別途
   - 公演時間が「18:00〜21:00」等記載なら start_time="18:00" end_time="21:00"
   - 開場時間 (OPEN) と 開演時間 (START) が両方あれば start_time=開演、OPEN は notes に記載
   - 終了時刻が未記載なら end_time=""
7. sub_event_title は補足 (会場名 + 回数 + 先行種別 等)
8. confidence は 0-100 (推定信頼度)
9. 不明項目は空文字。絶対に事実を創作しない
10. 画像から読み取れる年が不明で、相対的な日付表記だけの場合はスクショ撮影時期から推測せず空文字にする

出力フォーマット (厳格 JSON):
{
  "events": [
    {
      "event_title": "...",
      "sub_event_title": "...",
      "start_date": "2026-05-30",
      "end_date": null,
      "start_time": "18:00",
      "end_time": "21:00",
      "tag": "CONCERT",
      "country": "KR",
      "spot_name": "...",
      "source_url": "",
      "image_url": "",
      "confidence": 85,
      "notes": "..."
    }
  ]
}

補足情報:
- ソースURL: ${sourceUrl || '(未指定)'}
- 投稿者メモ: ${note || '(なし)'}

返すのは JSON オブジェクトのみ。余計な説明・マークダウン・コードフェンス禁止。`

    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      prompt,
    ])

    const text = result.response.text()
    console.log('[analyze-notice] raw Gemini response:', text.slice(0, 800))

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'AIの応答からJSONを抽出できませんでした', raw: text.slice(0, 500) },
        { status: 422 },
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('[analyze-notice] JSON parse error:', e)
      return NextResponse.json(
        { error: 'JSONパースエラー', raw: text.slice(0, 500) },
        { status: 422 },
      )
    }

    const rawEvents = Array.isArray((parsed as Record<string, unknown>)?.events)
      ? ((parsed as Record<string, unknown>).events as unknown[])
      : []

    const events = rawEvents
      .map((r) => sanitizeEvent(r, sourceUrl))
      .filter((e): e is AnalyzedEvent => e !== null)

    console.log(`[analyze-notice] extracted ${events.length} events from ${rawEvents.length} raw`)
    return NextResponse.json({ events })
  } catch (e) {
    console.error('analyze-notice error:', e)
    const message = e instanceof Error ? e.message : 'server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
