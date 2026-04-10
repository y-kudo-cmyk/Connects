import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // profiles はDBトリガー handle_new_user が自動作成
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // エラー時はログインに戻す
  return NextResponse.redirect(`${origin}/login`)
}
