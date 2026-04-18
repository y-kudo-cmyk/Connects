import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || ''
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

      if (event.type === 'message' && event.message?.type === 'text') {
        const inputText = event.message.text.trim()
        const emailMatch = inputText
          .replace(/[\s\u3000]/g, '')
          .match(/[\w.+\-]+@[\w\-]+\.[a-z]{2,}/i)
        if (emailMatch) {
          const reply = await linkLineUserId(lineUserId, emailMatch[0])
          await sendLineReply(lineUserId, reply)
        }
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
