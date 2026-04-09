import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // profiles レコードが未作成なら自動作成
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()
        if (!profile) {
          await supabase.from('profiles').insert({
            id: user.id,
            mail: user.email ?? '',
            nickname: user.user_metadata?.name ?? user.email?.split('@')[0] ?? '',
            avatar_url: user.user_metadata?.avatar_url ?? '',
            join_date: new Date().toISOString(),
          })
        }
      }
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // エラー時はログインに戻す
  return NextResponse.redirect(`${origin}/login`)
}
