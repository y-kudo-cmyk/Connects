export const maxDuration = 60

// Weverse トークン自動リフレッシュ Cron
//
// 12 時間ごとに起動し、
//  - access_token が 24 時間以内に切れる場合は refresh API を叩いて更新
//  - refresh_token が 3 日以内に切れる場合は admin に LINE 警告
//    (refresh_token はブラウザログインし直しが必要なため手動介入)
//
// 実行条件:
//  - Vercel Cron Bearer (Authorization: Bearer $CRON_SECRET), または
//  - ?debug=TEMP_DEBUG_WEVERSE_2026_0422 (検証後削除)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getLatestTokens,
  refreshTokens,
  saveTokens,
} from '@/lib/weverseTokens'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const ADMIN_LINE_ID = 'Ub88e74f829aeecc9d5fa1cfee7161199'
const DEBUG_KEY = 'TEMP_DEBUG_WEVERSE_2026_0422'

async function sendLine(text: string): Promise<void> {
  const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!TOKEN) return
  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: ADMIN_LINE_ID,
        messages: [{ type: 'text', text: text.slice(0, 500) }],
      }),
    })
  } catch {
    // admin 通知失敗は吞む (本体フローは続行)
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const debugKey = request.nextUrl.searchParams.get('debug')
  const authorized =
    (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
    debugKey === DEBUG_KEY
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []

  const current = await getLatestTokens(supabase)
  if (!current) {
    log.push('no tokens available (DB empty and env not set)')
    await sendLine('Weverse トークンが DB にも env にも無い。初回セットアップが必要。')
    return NextResponse.json({ log, ok: false }, { status: 500 })
  }

  const now = Date.now()
  const accessHoursLeft =
    (current.access_expires_at.getTime() - now) / 3_600_000
  const refreshDaysLeft =
    (current.refresh_expires_at.getTime() - now) / 86_400_000
  log.push(`access expires in ${accessHoursLeft.toFixed(1)} hours`)
  log.push(`refresh expires in ${refreshDaysLeft.toFixed(1)} days`)

  // refresh_token の期限が迫っている場合は admin に警告
  // (3 日以内: ブラウザログインし直し → DB 手動更新が必要)
  if (refreshDaysLeft < 3) {
    log.push('refresh token expires soon, sending LINE warning')
    await sendLine(
      `Weverse refresh_token が ${refreshDaysLeft.toFixed(1)} 日で期限切れ\n` +
        `ブラウザで weverse.io にログインし直し、新しい we2_access_token / we2_refresh_token を取得 → ` +
        `Supabase weverse_tokens テーブルを手動更新してください (docs/weverse-token-setup.md 参照)。`,
    )
  }

  // access_token が 24 時間以上残っているならリフレッシュ不要
  if (accessHoursLeft > 24) {
    log.push('access token still valid >24h, skip refresh')
    return NextResponse.json({ log, ok: true, refreshed: false })
  }

  // refresh_token 自体が既に切れていたら API 叩いても無駄
  if (refreshDaysLeft <= 0) {
    log.push('refresh token already expired, cannot refresh')
    await sendLine('Weverse refresh_token 期限切れ。手動更新必須。')
    return NextResponse.json({ log, ok: false, refreshed: false }, { status: 500 })
  }

  const next = await refreshTokens(current)
  if (!next) {
    log.push('refresh API call failed')
    await sendLine('Weverse token refresh API 失敗。手動確認が必要。')
    return NextResponse.json({ log, ok: false }, { status: 500 })
  }

  const { error: saveErr } = await saveTokens(supabase, next)
  if (saveErr) {
    log.push(`save failed: ${saveErr}`)
    await sendLine(`Weverse token 保存失敗: ${saveErr.slice(0, 200)}`)
    return NextResponse.json({ log, ok: false }, { status: 500 })
  }

  log.push(`refreshed. new access exp: ${next.access_expires_at.toISOString()}`)
  log.push(`refreshed. new refresh exp: ${next.refresh_expires_at.toISOString()}`)
  return NextResponse.json({ log, ok: true, refreshed: true })
}
