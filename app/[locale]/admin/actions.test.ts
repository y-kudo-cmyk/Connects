import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

const mockGetUser = vi.fn()

function createChain(finalResult: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, any> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockResolvedValue(finalResult)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(finalResult)
  // For update/delete that end with .eq()
  chain.eq.mockImplementation(() => {
    // If the chain ends here (after update or delete), resolve the promise
    return { ...chain, then: (res: any) => Promise.resolve(finalResult).then(res) }
  })
  return chain
}

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Helper: set up admin user
function setupAdminUser() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'admin-user-id' } },
  })
  const profileChain = createChain({ data: { role: 'admin' }, error: null })
  // First call to .from('profiles') for role check
  mockFrom.mockReturnValueOnce(profileChain)
}

// Helper: set up non-admin user
function setupNonAdminUser() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'normal-user-id' } },
  })
  const profileChain = createChain({ data: { role: 'user' }, error: null })
  mockFrom.mockReturnValueOnce(profileChain)
}

// Helper: set up unauthenticated
function setupUnauthenticated() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAdmin (via actions)', () => {
  it('未認証ユーザーは Unauthorized エラー', async () => {
    setupUnauthenticated()

    const { updateEventStatus } = await import('./actions')
    await expect(updateEventStatus('event-1', 'confirmed')).rejects.toThrow('Unauthorized')
  })

  it('admin以外は Forbidden エラー', async () => {
    setupNonAdminUser()

    const { updateEventStatus } = await import('./actions')
    await expect(updateEventStatus('event-1', 'confirmed')).rejects.toThrow('Forbidden')
  })
})

describe('updateEventStatus', () => {
  it('admin ユーザーはイベントステータスを更新できる', async () => {
    setupAdminUser()
    const chain = createChain({ data: null, error: null })
    mockFrom.mockReturnValueOnce(chain)

    const { updateEventStatus } = await import('./actions')
    await updateEventStatus('event-1', 'confirmed')

    expect(mockFrom).toHaveBeenCalledWith('events')
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'confirmed' })
    )
  })

  it('Supabase エラー時は例外を投げる', async () => {
    setupAdminUser()
    const chain = createChain({ data: null, error: { message: 'DB error' } })
    mockFrom.mockReturnValueOnce(chain)

    const { updateEventStatus } = await import('./actions')
    await expect(updateEventStatus('event-1', 'confirmed')).rejects.toThrow('DB error')
  })
})

describe('deleteEvent', () => {
  it('admin ユーザーはイベントを削除できる', async () => {
    setupAdminUser()
    const chain = createChain({ data: null, error: null })
    mockFrom.mockReturnValueOnce(chain)

    const { deleteEvent } = await import('./actions')
    await deleteEvent('event-1')

    expect(mockFrom).toHaveBeenCalledWith('events')
    expect(chain.delete).toHaveBeenCalled()
  })
})

describe('updateUserRole', () => {
  it('admin ユーザーはロールを変更できる', async () => {
    setupAdminUser()
    const chain = createChain({ data: null, error: null })
    mockFrom.mockReturnValueOnce(chain)

    const { updateUserRole } = await import('./actions')
    await updateUserRole('user-1', 'admin')

    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(chain.update).toHaveBeenCalledWith({ role: 'admin' })
  })
})

describe('createAnnouncement', () => {
  it('admin ユーザーはお知らせを作成できる', async () => {
    setupAdminUser()
    const chain = createChain({ data: null, error: null })
    mockFrom.mockReturnValueOnce(chain)

    const formData = new FormData()
    formData.set('title', 'テストお知らせ')
    formData.set('body', '本文')
    formData.set('link_url', '')
    formData.set('priority', '1')
    formData.set('published', 'true')

    const { createAnnouncement } = await import('./actions')
    await createAnnouncement(formData)

    expect(mockFrom).toHaveBeenCalledWith('announcements')
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'テストお知らせ',
        priority: 1,
        published: true,
      })
    )
  })
})

describe('deleteAnnouncement', () => {
  it('admin ユーザーはお知らせを削除できる', async () => {
    setupAdminUser()
    const chain = createChain({ data: null, error: null })
    mockFrom.mockReturnValueOnce(chain)

    const { deleteAnnouncement } = await import('./actions')
    await deleteAnnouncement('ann-1')

    expect(mockFrom).toHaveBeenCalledWith('announcements')
    expect(chain.delete).toHaveBeenCalled()
  })
})
