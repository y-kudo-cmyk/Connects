import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 既にprofileがあるか
  const { data: existing } = await sb.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (existing) return NextResponse.json({ ok: true, existing: true })

  const email = user.email || ''
  const normalized = email.toLowerCase().trim()

  // glide_usersから情報取得
  const { data: glideUser } = await sb.from('glide_users').select('*').ilike('mail', normalized).limit(1)
  const g = glideUser?.[0]

  // profile作成
  const { error } = await sb.from('profiles').insert({
    id: user.id,
    mail: email,
    nickname: g?.nickname || user.user_metadata?.name || email.split('@')[0],
    membership_number: g?.membership_number || '',
    avatar_url: g?.avatar_url || user.user_metadata?.avatar_url || '',
    language: 'ja',
    country: 'JP',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // glide_my_entriesの移行
  if (g) {
    const { data: entries } = await sb.from('glide_my_entries').select('*').ilike('mail', normalized).eq('migrated', false)
    if (entries && entries.length > 0) {
      for (const e of entries) {
        await sb.from('my_entries').insert({
          user_id: user.id,
          event_title: e.event_title,
          sub_event_title: e.sub_event_title || null,
          tag: e.tag || null,
          start_date: e.start_date || null,
          end_date: e.end_date || null,
          spot_name: e.spot_name || null,
          spot_address: e.spot_address || null,
          image_url: e.image_url || null,
          source_url: e.source_url || null,
          ticket_image_url: e.ticket_image_url || null,
          notes: e.notes || null,
        }).then(() => {
          sb.from('glide_my_entries').update({ migrated: true }).eq('id', e.id)
        })
      }
    }
  }

  // Glide時代の投稿spotを引き継ぎ: original_submitter_email が一致するspotに submitted_by を設定
  await sb.from('spots')
    .update({ submitted_by: user.id, original_submitter_email: null })
    .eq('original_submitter_email', normalized)

  return NextResponse.json({ ok: true, created: true })
}
