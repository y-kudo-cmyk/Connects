import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createClient()

  // PKCE flow (Google OAuth etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/`)
  }

  // Magic link with token_hash
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'email' | 'magiclink' })
    if (!error) return NextResponse.redirect(`${origin}/`)
  }

  // Implicit flow: tokens are in the hash fragment (#access_token=...)
  // The hash is not sent to the server, so we serve a page that reads it client-side
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Logging in...</title></head><body><script>
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        window.location.href = '/' + hash;
      } else {
        window.location.href = '/login';
      }
    </script></body></html>`,
    { headers: { 'Content-Type': 'text/html' } },
  )
}
