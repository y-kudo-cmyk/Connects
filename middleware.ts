import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function middleware(_request: NextRequest) {
  // 一時的に認証チェックを無効化（テスト用）
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 以下を除く全パスにマッチ:
     * - _next/static, _next/image
     * - favicon.ico, sitemap.xml, robots.txt
     * - 画像・フォント等の静的ファイル
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
