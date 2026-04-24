import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
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
      const { data: before } = await sb.from('spot_photos').select('spot_id, image_url, submitted_by, contributor').eq('id', photoId).maybeSingle()
      const { error } = await sb.from('spot_photos').update({ status: 'deleted' }).eq('id', photoId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      await sb.from('user_activity').insert({
        user_id: user.id,
        action: 'admin_delete_photo',
        detail: JSON.stringify({ photo_id: photoId, spot_id: before?.spot_id, image_url: before?.image_url, original_submitter: before?.submitted_by, original_contributor: before?.contributor }),
      })
      return NextResponse.json({ ok: true, deleted: 'photo', id: photoId })
    }

    if (!spotId) return NextResponse.json({ error: 'Missing spotId or photoId' }, { status: 400 })

    const { data: spotBefore } = await sb.from('spots').select('spot_name, spot_address, submitted_by').eq('id', spotId).maybeSingle()
    const { data: photosBefore } = await sb.from('spot_photos').select('id').eq('spot_id', spotId)
    await sb.from('spot_photos').update({ status: 'deleted' }).eq('spot_id', spotId)
    await sb.from('favorite_spots').delete().eq('spot_id', spotId)
    const { error } = await sb.from('spots').update({ status: 'deleted' }).eq('id', spotId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await sb.from('user_activity').insert({
      user_id: user.id,
      action: 'admin_delete_spot',
      detail: JSON.stringify({ spot_id: spotId, spot_name: spotBefore?.spot_name, address: spotBefore?.spot_address, original_submitter: spotBefore?.submitted_by, cascaded_photo_ids: (photosBefore || []).map(p => p.id) }),
    })

    return NextResponse.json({ ok: true, deleted: 'spot', id: spotId })
  } catch (e) {
    console.error('[delete-spot]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
