import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_LINE_ID = 'Ub88e74f829aeecc9d5fa1cfee7161199'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, message } = await req.json()

  const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!LINE_TOKEN) return NextResponse.json({ error: 'LINE not configured' }, { status: 500 })

  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: ADMIN_LINE_ID,
      messages: [{ type: 'text', text: message }],
    }),
  })

  return NextResponse.json({ ok: true })
}
