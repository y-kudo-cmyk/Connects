import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { normalizeGlideTag, findEventId } from '@/lib/migration/glideTagMap'

export async function POST(req: NextRequest) {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const email = user.email || ''
  const normalized = email.toLowerCase().trim()

  // 既にprofileがあるか
  const { data: existing } = await sb.from('profiles').select('id, mail, ref_code, introduced_by, line_user_id, membership_number, is_verified, nickname').eq('id', user.id).maybeSingle()
  if (existing) {
    const updates: Record<string, unknown> = {}
    // mail が空なら補完
    if ((!existing.mail || existing.mail === '') && email) updates.mail = email

    // glide_users 全情報で不足分を補完
    const { data: glideUser } = await sb.from('glide_users').select('nickname, ref_code, introduced_by, is_verified, line_user_id, membership_number').ilike('mail', normalized).maybeSingle()
    if (glideUser) {
      if ((!existing.ref_code || existing.ref_code === '') && glideUser.ref_code) updates.ref_code = glideUser.ref_code
      if ((!existing.introduced_by || existing.introduced_by === '') && glideUser.introduced_by) updates.introduced_by = glideUser.introduced_by
      if ((!existing.line_user_id || existing.line_user_id === '') && glideUser.line_user_id) updates.line_user_id = glideUser.line_user_id
      if ((!existing.membership_number || existing.membership_number === '') && glideUser.membership_number) updates.membership_number = glideUser.membership_number
      if (existing.is_verified !== true && glideUser.is_verified === true) updates.is_verified = true
      if ((!existing.nickname || existing.nickname === '') && glideUser.nickname && !glideUser.nickname.includes('@')) updates.nickname = glideUser.nickname
    }

    if (Object.keys(updates).length > 0) {
      const { error: fixErr } = await sb.from('profiles').update(updates).eq('id', user.id)
      if (fixErr) console.error('create-profile: backfill failed:', fixErr.message)
    }
    return NextResponse.json({ ok: true, existing: true, filled: Object.keys(updates) })
  }

  // glide_usersから情報取得
  const { data: glideUser } = await sb.from('glide_users').select('*').ilike('mail', normalized).limit(1)
  const g = glideUser?.[0]

  // profile作成
  // nickname: Glide 側にあればそれを、それ以外はユーザーが後から設定するまで空。
  // email を勝手に nickname に入れない（MAP 等で個人情報が出る）。
  const glideNickname = g?.nickname || ''
  const nickname = glideNickname.includes('@') ? '' : glideNickname
  const { error } = await sb.from('profiles').insert({
    id: user.id,
    mail: email,
    nickname,
    membership_number: g?.membership_number || '',
    avatar_url: g?.avatar_url || user.user_metadata?.avatar_url || '',
    ref_code: g?.ref_code || '',          // Glide 紹介コード引継ぎ
    introduced_by: g?.introduced_by || '', // 招待者
    is_verified: g?.is_verified || false,
    line_user_id: g?.line_user_id || '',  // Glide LINE ID 引継ぎ
    language: 'ja',
    country: 'JP',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // glide_my_entriesの移行 — タグ正規化 + events 紐付け
  if (g) {
    const { data: entries } = await sb.from('glide_my_entries').select('*').ilike('mail', normalized).eq('migrated', false)
    if (entries && entries.length > 0) {
      for (const e of entries) {
        const tag = normalizeGlideTag(e.tag)
        const eventId = await findEventId(sb as never, e.event_title || '', e.start_date)
        const { error: insErr } = await sb.from('my_entries').insert({
          user_id: user.id,
          event_id: eventId,             // events と紐付け (無ければ null でスナップ)
          event_title: e.event_title,
          sub_event_title: e.sub_event_title || null,
          tag,
          start_date: e.start_date || null,
          end_date: e.end_date || null,
          spot_name: e.spot_name || null,
          spot_address: e.spot_address || null,
          image_url: e.image_url || null,
          source_url: e.source_url || null,
          ticket_image_url: e.ticket_image_url || null,
          notes: e.notes || null,
        })
        // 正常に my_entries に入った行だけ migrated=true にする
        if (!insErr) {
          await sb.from('glide_my_entries').update({ migrated: true }).eq('id', e.id)
        } else {
          console.error('create-profile: my_entries insert failed:', insErr.message)
        }
      }
    }
  }

  // Glide時代の投稿spotを引き継ぎ: original_submitter_email が一致するspotに submitted_by を設定
  await sb.from('spots')
    .update({ submitted_by: user.id, original_submitter_email: null })
    .eq('original_submitter_email', normalized)

  return NextResponse.json({ ok: true, created: true })
  } catch (e) {
    console.error('[create-profile]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
