import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// LINE 署名検証
function verifyLineSignature(bodyText: string, signature: string | null): boolean {
  if (!LINE_CHANNEL_SECRET || !signature) return true // secret 未設定時は検証スキップ（開発用）
  const hash = crypto.createHmac('sha256', LINE_CHANNEL_SECRET).update(bodyText).digest('base64')
  return hash === signature
}

// ── LINE にメッセージ送信 ────────────────────────────────────
async function sendLineReply(userId: string, message: string) {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text: message }],
    }),
  })
}

// ── メールアドレスの正規化（全角・スペース・改行除去） ────────
function normalizeEmail(input: string): string {
  return input
    .replace(/[\s\u3000\r\n\t]/g, '')  // 全角スペース、半角スペース、改行、タブ除去
    .replace(/＠/g, '@')                // 全角@を半角に
    .replace(/．/g, '.')                // 全角ピリオドを半角に
    .replace(/[\uff01-\uff5e]/g, (c) => // その他全角英数字を半角に
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    )
    .toLowerCase()
    .trim()
}

// ── LINE ID とメールアドレスの紐付け ─────────────────────────
async function linkLineUserId(lineUserId: string, email: string) {
  const normalizedEmail = normalizeEmail(email)

  // 1. profiles テーブルで検索（既にログイン済みユーザー）
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, mail, line_user_id')
    .eq('mail', normalizedEmail)
    .maybeSingle()

  if (profile) {
    if (profile.line_user_id === lineUserId) {
      return '✅ すでに連携済みです！\nConnects+をお楽しみください🎵'
    }
    await supabase
      .from('profiles')
      .update({ line_user_id: lineUserId })
      .eq('id', profile.id)
    return '✅ 連携完了しました！\nConnects+でLINE通知が届くようになります🎵'
  }

  // 2. glide_users テーブルで検索（まだログインしていないGlideユーザー）
  const { data: glideUser } = await supabase
    .from('glide_users')
    .select('mail, line_user_id')
    .eq('mail', normalizedEmail)
    .maybeSingle()

  if (glideUser) {
    await supabase
      .from('glide_users')
      .update({ line_user_id: lineUserId })
      .eq('mail', normalizedEmail)
    return '✅ 連携完了しました！\nConnects+にログインすると通知が届くようになります🎵'
  }

  // 3. 見つからない
  return '❌ メールアドレスが見つかりませんでした。\nConnects+に登録済みのメールアドレスをご確認ください。\n\n💡 スペースや全角文字が入っていないかチェックしてみてください。'
}

// ── 投稿保存（URL / OCR 結果を schedule として保存） ──────────
async function saveSubmission(opts: {
  lineUserId: string
  inputData: string
  sourceUrl?: string
  imageUrl?: string
}) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('line_user_id', opts.lineUserId)
    .maybeSingle()

  const { error } = await supabase.from('contents_db').insert({
    submitted_at: new Date().toISOString(),
    post_type: 'schedule',
    input_data: opts.inputData,
    mail: opts.lineUserId,
    submitted_by: profile?.id || null,
    source_url: opts.sourceUrl || '',
    image_url: opts.imageUrl || '',
  })
  if (error) console.error('contents_db insert error:', error.message)
}

// ── LINE 画像取得 → Supabase Storage 保存 → Gemini OCR ────────
async function processImage(messageId: string): Promise<{ text: string; url: string; sourceUrl: string }> {
  // 1. LINE から画像バイナリ取得
  const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
    headers: { Authorization: `Bearer ${LINE_TOKEN}` },
  })
  if (!res.ok) throw new Error(`LINE image fetch failed: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())

  // 2. Supabase Storage へアップロード
  const filename = `line/${messageId}-${Date.now()}.jpg`
  const { error: upErr } = await supabase.storage.from('event-images').upload(filename, buffer, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  let imageUrl = ''
  if (!upErr) {
    imageUrl = supabase.storage.from('event-images').getPublicUrl(filename).data.publicUrl
  }

  // 3. Gemini OCR
  let text = '画像解析未実行'
  let sourceUrl = ''
  if (GEMINI_API_KEY) {
    const base64 = buffer.toString('base64')
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: 'image/jpeg', data: base64 } },
                {
                  text: `この画像からイベント・スケジュール情報を抽出して以下のJSONのみ返してください。

{
  "text": "画像に含まれるテキストや情報をすべて抽出。イベント名・日時・会場など重要な情報を漏らさず",
  "source_url": "画像内に含まれるURL（公式HP・SNS投稿URLなど）。なければ空文字"
}`,
                },
              ],
            }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
          }),
        }
      )
      if (geminiRes.ok) {
        const g = await geminiRes.json()
        const raw = g?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        try {
          const parsed = JSON.parse(raw)
          text = parsed.text || raw
          sourceUrl = parsed.source_url || ''
        } catch {
          text = raw
        }
      } else {
        text = `Gemini解析失敗 (${geminiRes.status})`
      }
    } catch (e) {
      text = `Gemini呼び出しエラー: ${(e as Error).message}`
    }
  }
  return { text, url: imageUrl, sourceUrl }
}

// ── Webhook エンドポイント ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text()
    const signature = request.headers.get('x-line-signature')
    if (!verifyLineSignature(bodyText, signature)) {
      return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 401 })
    }
    const body = JSON.parse(bodyText)
    const events = body.events || []

    for (const event of events) {
      if (!event.source?.userId) continue
      const lineUserId = event.source.userId
      if (event.type !== 'message') continue

      // --- text ---
      if (event.message?.type === 'text') {
        const inputText = event.message.text.trim()

        // 1. メール検出 → 紐付け
        const emailMatch = inputText
          .replace(/[\s\u3000]/g, '')
          .match(/[\w.+\-]+@[\w\-]+\.[a-z]{2,}/i)
        if (emailMatch) {
          const reply = await linkLineUserId(lineUserId, emailMatch[0])
          await sendLineReply(lineUserId, reply)
          continue
        }

        // 2. URL検出 → schedule として保存
        if (/https?:\/\//i.test(inputText)) {
          await saveSubmission({ lineUserId, inputData: inputText, sourceUrl: inputText })
          await sendLineReply(lineUserId, '✅ 受信しました！確認後にスケジュールへ追加されます📅')
          continue
        }
      }

      // --- image ---
      if (event.message?.type === 'image' && event.message?.id) {
        try {
          const { text, url, sourceUrl } = await processImage(event.message.id)
          await saveSubmission({ lineUserId, inputData: text, sourceUrl, imageUrl: url })
          await sendLineReply(lineUserId, '✅ 画像を受信して解析しました！確認後にスケジュールへ追加されます📅')
        } catch (err) {
          console.error('Image process error:', err)
          await sendLineReply(lineUserId, '❌ 画像処理に失敗しました。しばらくしてから再送してください。')
        }
        continue
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('LINE Webhook error:', e)
    return NextResponse.json({ ok: true }) // LINE に 200 を返さないとリトライされる
  }
}

// LINE の Webhook URL 検証用（GET）
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
