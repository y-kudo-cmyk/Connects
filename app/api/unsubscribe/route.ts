import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'

const SECRET = process.env.UNSUBSCRIBE_SECRET || ''

/**
 * HMAC-SHA256 でステートレス token を生成
 * token = base64url(HMAC(email, secret)).slice(0, 32)
 */
function makeToken(email: string): string {
  const h = createHmac('sha256', SECRET)
  h.update(email.toLowerCase().trim())
  return h.digest('base64url').slice(0, 32)
}

function verifyToken(email: string, token: string): boolean {
  const expected = makeToken(email)
  if (expected.length !== token.length) return false
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}

// GET /api/unsubscribe?email=...&token=... → 配信停止 (1-click)
export async function GET(req: NextRequest) {
  if (!SECRET) {
    return NextResponse.json({ error: 'UNSUBSCRIBE_SECRET not configured' }, { status: 500 })
  }

  const url = new URL(req.url)
  const email = url.searchParams.get('email')?.toLowerCase().trim()
  const token = url.searchParams.get('token')

  if (!email || !token) {
    return htmlPage('error', '無効なリンクです', 'メールアドレスまたはトークンが指定されていません。')
  }
  if (!email.includes('@') || email.length > 200) {
    return htmlPage('error', '無効なリンクです', 'メールアドレスの形式が正しくありません。')
  }
  if (!verifyToken(email, token)) {
    return htmlPage('error', '無効なリンクです', 'トークンの検証に失敗しました。')
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const ua = req.headers.get('user-agent') || null

  const { error } = await sb.from('email_unsubscribes').upsert({
    email,
    unsubscribed_at: new Date().toISOString(),
    ip_address: ip,
    user_agent: ua,
  }, { onConflict: 'email' })

  if (error) {
    console.error('[unsubscribe] DB error:', error.message)
    return htmlPage('error', 'エラーが発生しました', '時間をおいて再度お試しください。')
  }

  return htmlPage('ok', '配信を停止しました',
    `<strong>${escapeHtml(email)}</strong> 宛のお知らせメールを停止しました。<br/>今後、Connects+ からの一斉メールは届きません。`)
}

// RFC 8058: Gmail/Apple の 1-click List-Unsubscribe POST 対応
export async function POST(req: NextRequest) {
  return GET(req)
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))
}

function htmlPage(kind: 'ok' | 'error', title: string, body: string) {
  const color = kind === 'ok' ? '#22C55E' : '#EF4444'
  const bg = kind === 'ok' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'
  const icon = kind === 'ok' ? '✓' : '✗'
  const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Connects+</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', sans-serif; margin: 0; padding: 0; background: #F8F9FA; color: #1C1C1E; }
  .wrap { max-width: 480px; margin: 0 auto; padding: 60px 24px 24px; text-align: center; }
  .icon { width: 56px; height: 56px; border-radius: 50%; background: ${bg}; color: ${color}; font-size: 32px; line-height: 56px; margin: 0 auto 18px; font-weight: 900; }
  h1 { font-size: 20px; margin: 0 0 14px; }
  p { font-size: 14px; color: #636366; line-height: 1.7; margin: 0 0 20px; }
  .back { display: inline-block; padding: 12px 22px; background: #F3B4E3; color: #fff; text-decoration: none; border-radius: 12px; font-size: 13px; font-weight: 700; }
</style></head><body><div class="wrap">
  <div class="icon">${icon}</div>
  <h1>${escapeHtml(title)}</h1>
  <p>${body}</p>
  <a class="back" href="https://app.connectsplus.net">Connects+ を開く</a>
</div></body></html>`
  return new NextResponse(html, {
    status: kind === 'ok' ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
