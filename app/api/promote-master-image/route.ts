import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// ユーザーがアップした画像を card_master の台紙(マスター画像)として昇格させる。
// card_master.front_image_url / back_image_url が空の場合のみ更新 (早い者勝ち)。
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cardMasterId, frontUrl, backUrl } = await req.json()
  if (!cardMasterId || typeof cardMasterId !== 'string') {
    return NextResponse.json({ error: 'missing cardMasterId' }, { status: 400 })
  }

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: master, error } = await sb
    .from('card_master')
    .select('id, front_image_url, back_image_url')
    .eq('id', cardMasterId)
    .maybeSingle()
  if (error || !master) return NextResponse.json({ error: 'card not found' }, { status: 404 })

  const updates: Record<string, string> = {}
  // 空のフィールドだけ更新 (早い者勝ち、他ユーザーの台紙は上書きしない)
  if (frontUrl && !master.front_image_url) updates.front_image_url = frontUrl
  if (backUrl && !master.back_image_url) updates.back_image_url = backUrl

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, promoted: 'none', reason: 'master already has images or no urls provided' })
  }

  const { error: updErr } = await sb.from('card_master').update(updates).eq('id', cardMasterId)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  // 貢献者ログ (user_activity)
  await sb.from('user_activity').insert({
    user_id: user.id,
    action: 'card_master_promote',
    detail: `${cardMasterId}: ${Object.keys(updates).join(',')}`,
  })

  return NextResponse.json({ ok: true, promoted: Object.keys(updates) })
}
