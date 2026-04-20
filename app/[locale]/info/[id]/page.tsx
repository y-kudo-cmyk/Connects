import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

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
  link_url: string | null
  published: boolean
  created_at: string
}

async function getAnnouncement(id: string): Promise<Announcement | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  const s = createServiceClient(url, key)
  const { data } = await s.from('announcements').select('*').eq('id', id).eq('published', true).maybeSingle()
  return data as Announcement | null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id } = await params
  const a = await getAnnouncement(id)
  if (!a) return { title: 'お知らせ | Connects+' }
  return {
    title: `${a.title} | Connects+`,
    description: a.body?.slice(0, 120) || '',
  }
}

export default async function InfoPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params
  const a = await getAnnouncement(id)
  if (!a) notFound()

  const title = locale === 'en' ? (a.title_en || a.title) : locale === 'ko' ? (a.title_ko || a.title) : a.title
  const body = locale === 'en' ? (a.body_en || a.body) : locale === 'ko' ? (a.body_ko || a.body) : a.body
  const date = new Date(a.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'ko' ? 'ko-KR' : 'ja-JP')

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      <header style={{ padding: '20px 16px 14px', background: '#FFFFFF', borderBottom: '1px solid #F0F0F5' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', margin: 0 }}>Connects+</p>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1E', margin: '6px 0 4px' }}>{title}</h1>
          <p style={{ fontSize: 11, color: '#8E8E93', margin: 0 }}>{date}</p>
        </div>
      </header>
      <main style={{ padding: '24px 16px 48px' }}>
        <article style={{ maxWidth: 680, margin: '0 auto', background: '#FFFFFF', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 14, lineHeight: 1.9, color: '#1C1C1E', wordBreak: 'break-word' }}>
            {(body || '').replace(/\r\n/g, '\n').split('\n').map((line, i) => (
              <div key={i} style={{ display: 'block', minHeight: '1.9em' }}>{line || '\u00A0'}</div>
            ))}
          </div>
          {a.link_url && (
            <a
              href={a.link_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: 20,
                padding: '10px 18px',
                borderRadius: 999,
                background: '#F3B4E3',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              関連リンク ↗
            </a>
          )}
        </article>
      </main>
    </div>
  )
}
