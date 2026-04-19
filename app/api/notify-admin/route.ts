import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const ADMIN_LINE_ID = 'Ub88e74f829aeecc9d5fa1cfee7161199'
const RATE_WINDOW_MIN = 30
const RATE_MAX_PER_WINDOW = 2
const ALLOWED_TYPES = ['login'] as const
type NotifyType = (typeof ALLOWED_TYPES)[number]

// サーバー側でメッセージを生成（クライアント渡しの任意文字列を本文にしない）
function buildMessage(type: NotifyType, userEmail: string | undefined): string {
  switch (type) {
    case 'login':
      return `🔔 ログイン\n${userEmail || ''}`.slice(0, 500)
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await req.json()
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: 'invalid type' }, { status: 400 })
  }

  const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!LINE_TOKEN) return NextResponse.json({ error: 'LINE not configured' }, { status: 500 })

  // レート制限: 直近 RATE_WINDOW_MIN 分で RATE_MAX_PER_WINDOW 件以上なら 429
  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString()
  const { count } = await sb.from('user_activity').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('action', 'notify_admin').gte('created_at', since)
  if ((count ?? 0) >= RATE_MAX_PER_WINDOW) {
    return NextResponse.json({ ok: true, throttled: true }, { status: 200 })
  }

  // 自分が admin の場合は通知しない
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role === 'admin') return NextResponse.json({ ok: true, skipped: 'self_admin' })

  const text = buildMessage(type as NotifyType, user.email)
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: ADMIN_LINE_ID,
      messages: [{ type: 'text', text }],
    }),
  }).catch(() => {})

  await sb.from('user_activity').insert({ user_id: user.id, action: 'notify_admin', detail: type })

  return NextResponse.json({ ok: true })
}
