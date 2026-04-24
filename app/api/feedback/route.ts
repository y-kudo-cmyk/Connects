import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const MAX_MESSAGE_LEN = 2000
const RATE_WINDOW_MIN = 10
const RATE_MAX_PER_WINDOW = 3

export async function POST(req: NextRequest) {
  // 認証必須（スパム防止）
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, nickname } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: 'message required' }, { status: 400 })
  }
  // 本文長さ制限
  const trimmed = message.trim().slice(0, MAX_MESSAGE_LEN)

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // レート制限: 直近 RATE_WINDOW_MIN 分で RATE_MAX_PER_WINDOW 件以上なら 429
  const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString()
  const { count } = await sb.from('feedback').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since)
  if ((count ?? 0) >= RATE_MAX_PER_WINDOW) {
    return NextResponse.json({ error: 'Too many feedback posts. Try again later.' }, { status: 429 })
  }

  const { error } = await sb.from('feedback').insert({
    user_id: user.id,
    nickname: nickname || '匿名',
    message: trimmed,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 工藤さんにLINE通知
  const ADMIN_LINE_ID = 'Ub88e74f829aeecc9d5fa1cfee7161199'
  const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (LINE_TOKEN) {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: ADMIN_LINE_ID,
        messages: [{ type: 'text', text: `📝 フィードバック\n${nickname || '匿名'}さんより:\n\n${trimmed.slice(0, 200)}` }],
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // admin のみ全フィードバック閲覧可 (一般ユーザーに他人の feedback が見えてた漏洩を塞ぐ)
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { data } = await sb.from('feedback').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}
