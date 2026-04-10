import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// ── Supabase mock ─────────────────────────────────────────────

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

// ── Helpers ───────────────────────────────────────────────────

function makeRequest(pathname: string) {
  return new NextRequest(new URL(pathname, 'http://localhost:3000'))
}

function setupUser(user: { id: string } | null) {
  mockGetUser.mockResolvedValue({ data: { user } })
}

function setupProfile(role: string) {
  const chain: Record<string, any> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: { role }, error: null })
  mockFrom.mockReturnValue(chain)
}

function isRedirect(response: NextResponse, pathname: string) {
  // NextResponse.redirect sets status 307/308 and Location header
  const location = response.headers.get('location')
  return (
    response.status >= 300 &&
    response.status < 400 &&
    location?.includes(pathname)
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

// ── Tests ─────────────────────────────────────────────────────

describe('updateSession', () => {
  // 公開ページ
  describe('公開ページ', () => {
    it('/login は未認証でもアクセス可能', async () => {
      setupUser(null)
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/login'))
      expect(isRedirect(response, '/login')).toBe(false)
    })

    it('/join は未認証でもアクセス可能', async () => {
      setupUser(null)
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/join'))
      expect(isRedirect(response, '/login')).toBe(false)
    })

    it('/api/* は未認証でもアクセス可能', async () => {
      setupUser(null)
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/api/analyze-ticket'))
      expect(isRedirect(response, '/login')).toBe(false)
    })

    it('/auth/callback は未認証でもアクセス可能', async () => {
      setupUser(null)
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/auth/callback'))
      expect(isRedirect(response, '/login')).toBe(false)
    })
  })

  // 保護ページ × 未認証
  describe('保護ページ × 未認証', () => {
    const protectedPaths = ['/', '/my', '/schedule', '/map', '/goods', '/profile']

    protectedPaths.forEach((path) => {
      it(`${path} は /login にリダイレクト`, async () => {
        setupUser(null)
        const { updateSession } = await import('./middleware')
        const response = await updateSession(makeRequest(path))
        expect(isRedirect(response, '/login')).toBe(true)
      })
    })

    it('/schedule/detail は /login にリダイレクト', async () => {
      setupUser(null)
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/schedule/detail'))
      expect(isRedirect(response, '/login')).toBe(true)
    })
  })

  // 保護ページ × 認証済み
  describe('保護ページ × 認証済み', () => {
    it('/ はそのまま通過', async () => {
      setupUser({ id: 'user-1' })
      setupProfile('user')
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/'))
      expect(isRedirect(response, '/login')).toBe(false)
    })

    it('/schedule はそのまま通過', async () => {
      setupUser({ id: 'user-1' })
      setupProfile('user')
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/schedule'))
      expect(isRedirect(response, '/login')).toBe(false)
    })
  })

  // 保護ページ × banned ユーザー
  describe('保護ページ × banned ユーザー', () => {
    it('/ は /login にリダイレクト', async () => {
      setupUser({ id: 'banned-user' })
      setupProfile('banned')
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/'))
      expect(isRedirect(response, '/login')).toBe(true)
    })

    it('/schedule は /login にリダイレクト', async () => {
      setupUser({ id: 'banned-user' })
      setupProfile('banned')
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/schedule'))
      expect(isRedirect(response, '/login')).toBe(true)
    })
  })

  // Admin ページ
  describe('Admin ページ × 未認証', () => {
    it('/admin は /login にリダイレクト', async () => {
      setupUser(null)
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/admin'))
      expect(isRedirect(response, '/login')).toBe(true)
    })

    it('/admin/posts は /login にリダイレクト', async () => {
      setupUser(null)
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/admin/posts'))
      expect(isRedirect(response, '/login')).toBe(true)
    })
  })

  describe('Admin ページ × 認証済み non-admin', () => {
    it('/admin は / にリダイレクト', async () => {
      setupUser({ id: 'user-1' })
      setupProfile('user')
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/admin'))
      expect(isRedirect(response, '/')).toBe(true)
      // /login にはリダイレクトしない
      expect(isRedirect(response, '/login')).toBe(false)
    })

    it('/admin/users は / にリダイレクト', async () => {
      setupUser({ id: 'user-1' })
      setupProfile('user')
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/admin/users'))
      expect(isRedirect(response, '/')).toBe(true)
    })
  })

  describe('Admin ページ × admin ユーザー', () => {
    it('/admin はそのまま通過', async () => {
      setupUser({ id: 'admin-1' })
      setupProfile('admin')
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/admin'))
      expect(isRedirect(response, '/login')).toBe(false)
      expect(isRedirect(response, '/')).toBe(false)
    })

    it('/admin/posts はそのまま通過', async () => {
      setupUser({ id: 'admin-1' })
      setupProfile('admin')
      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/admin/posts'))
      expect(isRedirect(response, '/login')).toBe(false)
      expect(isRedirect(response, '/')).toBe(false)
    })
  })

  // profile が null の場合（DBにレコードがない）
  describe('Admin ページ × profile が null', () => {
    it('/admin は / にリダイレクト', async () => {
      setupUser({ id: 'user-no-profile' })
      // profile が見つからない場合
      const chain: Record<string, any> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const { updateSession } = await import('./middleware')
      const response = await updateSession(makeRequest('/admin'))
      expect(isRedirect(response, '/')).toBe(true)
    })
  })
})
