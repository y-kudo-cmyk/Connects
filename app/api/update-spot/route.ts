import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// スクレイピング由来のヒントメモかどうか判定（ユーザー手書きメモは残す）
function isScrapedHintMemo(memo: string | null | undefined): boolean {
  if (!memo) return false
  return (
    memo.includes('[인스타') ||
    memo.includes('[SVT Record') ||
    memo.includes('[위버스') ||
    memo.toLowerCase().includes('instagram story')
  )
}

// admin だけが書き換え可能なフィールド（非admin値は無視）
const ADMIN_ONLY_SPOT_FIELDS = ['status', 'verified_count', 'artist_id', 'submitted_by', 'is_master', 'checked']
const ADMIN_ONLY_EVENT_FIELDS = ['status', 'verified_count', 'artist_id', 'submitted_by', 'checked', 'cancelled']
const ADMIN_ONLY_PHOTO_FIELDS = ['status', 'votes', 'submitted_by']
function stripAdminOnly(updates: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const out = { ...updates }
  for (const k of keys) delete out[k]
  return out
}

export async function POST(req: NextRequest) {
  // 認証チェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { spotId, photoId, updates, _table, _createSpot, _visitDate } = await req.json()

  if (_createSpot && updates) {
    const sb = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: lastSpot } = await sb.from('spots').select('id').order('id', { ascending: false }).limit(1)
    const lastNum = lastSpot?.[0]?.id ? parseInt(lastSpot[0].id.replace('SP', '')) : 0
    const newId = 'SP' + String(lastNum + 1).padStart(5, '0')
    const { error } = await sb.from('spots').insert({ id: newId, ...updates, submitted_by: user.id, last_edited_by: user.id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // spot image があれば spot_photos 行も作成（詳細モーダルのカルーセルで表示されるように）
    if (updates.image_url) {
      await sb.from('spot_photos').insert({
        spot_id: newId,
        image_url: updates.image_url,
        source_url: updates.source_url || null,
        platform: null,
        tags: updates.related_artists || null,
        contributor: null,
        submitted_by: user.id,
        visit_date: _visitDate || null,
        status: 'pending',
        votes: 0,
      })
    }
    // 投稿活動ログ
    await sb.from('user_activity').insert({
      user_id: user.id,
      action: 'spot_add',
      detail: `spot:${newId}`,
    })
    return NextResponse.json({ ok: true, id: newId })
  }

  if ((!spotId && !photoId) || !updates) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 呼び出し元の admin 判定（admin のみ特権フィールド書換OK）
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const isAdmin = profile?.role === 'admin'

  let editDetail = ''

  if (photoId) {
    // 一般ユーザーは admin-only フィールドを除外
    const safeUpdates = isAdmin ? updates : stripAdminOnly(updates, ADMIN_ONLY_PHOTO_FIELDS)
    // 最終更新者を記録
    const { error } = await sb.from('spot_photos').update({ ...safeUpdates, last_edited_by: user.id }).eq('id', photoId)
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
    // source_url / spot_url が埋まったらヒントmemoをクリア（スクレピング由来のみ、手書きは温存）
    const filledPhotoUrl =
      (updates.source_url && String(updates.source_url).trim()) ||
      (updates.spot_url && String(updates.spot_url).trim())
    if (filledPhotoUrl && spotId) {
      const { data: spotRow } = await sb.from('spots').select('memo').eq('id', spotId).maybeSingle()
      if (isScrapedHintMemo(spotRow?.memo)) {
        await sb.from('spots').update({ memo: '' }).eq('id', spotId)
      }
    }
    editDetail = `photo:${photoId}:${Object.keys(safeUpdates).join(',')}`
  } else if (_table === 'events') {
    // イベントの更新（admin-only フィールドは一般ユーザーからは無視）
    const safeUpdates = isAdmin ? updates : stripAdminOnly(updates, ADMIN_ONLY_EVENT_FIELDS)
    const { error } = await sb.from('events').update({ ...safeUpdates, last_edited_by: user.id }).eq('id', spotId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    editDetail = `event:${spotId}:${Object.keys(safeUpdates).join(',')}`
  } else {
    // スポットの更新（admin-only フィールドは一般ユーザーからは無視）
    const safeUpdates = isAdmin ? updates : stripAdminOnly(updates, ADMIN_ONLY_SPOT_FIELDS)
    const { error } = await sb.from('spots').update({ ...safeUpdates, last_edited_by: user.id }).eq('id', spotId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // spot 自身の source_url または spot_url が埋まったらヒントmemoクリア（スクレピング由来のみ）
    const filledSpotUrl =
      (updates.source_url && String(updates.source_url).trim()) ||
      (updates.spot_url && String(updates.spot_url).trim())
    if (filledSpotUrl) {
      const { data: spotRow } = await sb.from('spots').select('memo').eq('id', spotId).maybeSingle()
      if (isScrapedHintMemo(spotRow?.memo)) {
        await sb.from('spots').update({ memo: '' }).eq('id', spotId)
      }
    }
    editDetail = `spot:${spotId}:${Object.keys(safeUpdates).join(',')}`
  }

  // 編集ログを記録 (統計用)
  await sb.from('user_activity').insert({
    user_id: user.id,
    action: 'edit',
    detail: editDetail,
  })

  return NextResponse.json({ ok: true })
}
