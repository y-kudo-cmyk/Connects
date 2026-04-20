import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // 認証 + admin ロールチェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { spotId, photoId } = await req.json()

  if (photoId) {
    // Soft delete（行は保持、status='deleted' で非表示）
    const { error } = await sb.from('spot_photos').update({ status: 'deleted' }).eq('id', photoId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, deleted: 'photo', id: photoId })
  }

  if (!spotId) return NextResponse.json({ error: 'Missing spotId or photoId' }, { status: 400 })

  // スポット削除も soft delete：spot と紐づく photos を status='deleted' に。
  // favorite_spots は集計外の関連表なので物理削除維持。
  await sb.from('spot_photos').update({ status: 'deleted' }).eq('spot_id', spotId)
  await sb.from('favorite_spots').delete().eq('spot_id', spotId)
  const { error } = await sb.from('spots').update({ status: 'deleted' }).eq('id', spotId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, deleted: 'spot', id: spotId })
}
