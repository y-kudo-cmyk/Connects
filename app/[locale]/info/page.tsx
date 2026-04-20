import { createClient as createServiceClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Announcement {
  id: string
  title: string
  body: string
  title_en: string | null
  body_en: string | null
  title_ko: string | null
  body_ko: string | null
  priority: number
  published: boolean
  created_at: string
}

async function getAnnouncements(): Promise<Announcement[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return []
  const s = createServiceClient(url, key)
  const { data } = await s
    .from('announcements')
    .select('*')
    .eq('published', true)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
  return (data as Announcement[]) || []
}

export const metadata = { title: 'お知らせ | Connects+' }

export default async function InfoListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const items = await getAnnouncements()

  const pick = (a: Announcement) => {
    const title = locale === 'en' ? (a.title_en || a.title) : locale === 'ko' ? (a.title_ko || a.title) : a.title
    const body = locale === 'en' ? (a.body_en || a.body) : locale === 'ko' ? (a.body_ko || a.body) : a.body
    return { title, body }
  }

  const listLabel = locale === 'en' ? 'Announcements' : locale === 'ko' ? '공지사항' : 'お知らせ'
  const emptyLabel = locale === 'en' ? 'No announcements yet' : locale === 'ko' ? '공지사항이 없습니다' : 'お知らせはまだありません'

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      <header style={{ padding: '20px 16px 14px', background: '#FFFFFF', borderBottom: '1px solid #F0F0F5' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', margin: 0 }}>Connects+</p>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1E', margin: '6px 0 0' }}>{listLabel}</h1>
        </div>
      </header>
      <main style={{ padding: '16px', maxWidth: 680, margin: '0 auto' }}>
        {items.length === 0 ? (
          <p style={{ fontSize: 13, color: '#8E8E93', textAlign: 'center', padding: '40px 0' }}>{emptyLabel}</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(a => {
              const { title } = pick(a)
              const date = new Date(a.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'ko' ? 'ko-KR' : 'ja-JP')
              return (
                <li key={a.id}>
                  <Link
                    href={`/${locale}/info/${a.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: '#FFFFFF',
                      borderRadius: 14,
                      padding: '14px 16px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: '#8E8E93' }}>{date}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1E', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title}
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
