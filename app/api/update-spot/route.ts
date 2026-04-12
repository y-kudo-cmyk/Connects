import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // 認証チェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { spotId, photoId, updates } = await req.json()
  if ((!spotId && !photoId) || !updates) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  if (photoId) {
    // 写真の更新
    const { error } = await sb.from('spot_photos').update(updates).eq('id', photoId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // spot の related_artists も写真のタグから再計算
    if (updates.tags && spotId) {
      const { data: photos } = await sb.from('spot_photos').select('tags').eq('spot_id', spotId)
      const allTags = new Set<string>()
      allTags.add('SEVENTEEN')
      for (const p of photos || []) {
        for (const t of (p.tags || '').split('#').map((s: string) => s.trim()).filter(Boolean)) {
          allTags.add(t)
        }
      }
      const relatedArtists = [...allTags].map(t => `#${t}`).join(' ')
      await sb.from('spots').update({ related_artists: relatedArtists }).eq('id', spotId)
    }
  } else {
    // スポットの更新
    const { error } = await sb.from('spots').update(updates).eq('id', spotId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
