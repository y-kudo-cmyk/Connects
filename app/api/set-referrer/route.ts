import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// 紹介者コードを設定する。profiles / glide_users のどちらかに存在していれば受け付ける。
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code } = await req.json()
    const trimmed = (code || '').trim()
    if (!trimmed) return NextResponse.json({ error: 'コードを入力してください' }, { status: 400 })

    const sb = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // 自分のコードチェック + 既に設定済みチェック
    const { data: me } = await sb.from('profiles').select('ref_code, introduced_by').eq('id', user.id).maybeSingle()
    if (!me) return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 })
    if (me.introduced_by) return NextResponse.json({ error: '既に紹介者が設定されています' }, { status: 400 })
    if (me.ref_code === trimmed) return NextResponse.json({ error: '自分のコードは登録できません' }, { status: 400 })

    // profiles / glide_users で存在確認
    const [{ data: inProfiles }, { data: inGlide }] = await Promise.all([
      sb.from('profiles').select('id').eq('ref_code', trimmed).maybeSingle(),
      sb.from('glide_users').select('membership_number').eq('ref_code', trimmed).maybeSingle(),
    ])
    if (!inProfiles && !inGlide) return NextResponse.json({ error: 'そのコードのユーザーは見つかりません' }, { status: 404 })

    const { error } = await sb.from('profiles').update({ introduced_by: trimmed }).eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[set-referrer]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
