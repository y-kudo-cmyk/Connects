import { type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // NOTE: 4/26 移行完了後に *.vercel.app → app.connectsplus.net への
  // 301 リダイレクトを有効化予定 (commit ba50b1c 参照)

  // 1. Supabase セッション管理 + 認証・認可チェック
  const supabaseResponse = await updateSession(request)

  // リダイレクトの場合はそのまま返す（認証・BAN・admin チェック）
  if (supabaseResponse.status >= 300 && supabaseResponse.status < 400) {
    return supabaseResponse
  }

  // 2. next-intl の locale 解決 + リライト
  const intlResponse = intlMiddleware(request)

  // Supabase が設定した cookie を intl レスポンスにコピー
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  return intlResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api|OneSignalSDKWorker\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|json)$).*)',
  ],
}
