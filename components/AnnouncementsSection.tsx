'use client'

import { Announcement, useAnnouncements } from '@/lib/useAnnouncements'
import { useTranslations, useLocale } from 'next-intl'

const TYPE_CONFIG = {
  important: { bg: '#FFF0F8', border: '#F3B4E3', color: '#C97AB8' },
  warning:   { bg: '#FFFBEB', border: '#FCD34D', color: '#B45309' },
  info:      { bg: '#EFF6FF', border: '#93C5FD', color: '#1D4ED8' },
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AnnouncementsSection({ announcements }: { announcements: Announcement[] }) {
  const t = useTranslations()
  const { visible, dismiss } = useAnnouncements(announcements)

  if (visible.length === 0) return null

  return (
    <section className="pb-2">
      <div className="flex items-center gap-2 px-4 mb-2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <h2 className="text-xs font-bold tracking-wider" style={{ color: '#636366' }}>
          {t('Home.announcements')}
        </h2>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}
        >
          {visible.length}{t('Common.items')}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {visible.map((ann) => (
          <AnnouncementCard key={ann.id} ann={ann} onDismiss={() => dismiss(ann.id)} />
        ))}
      </div>
    </section>
  )
}

function AnnouncementCard({ ann, onDismiss }: { ann: Announcement; onDismiss: () => void }) {
  const t = useTranslations()
  const locale = useLocale()
  const announcementLabels = t.raw('Home.announcementTypes') as Record<string, string>
  const cfg = TYPE_CONFIG[ann.type]
  const d = new Date(ann.date)

  // locale に応じてタイトル・本文を切り替え（翻訳が空なら日本語にフォールバック）
  const title = (locale === 'en' && ann.title_en) || (locale === 'ko' && ann.title_ko) || ann.title
  const body = (locale === 'en' && ann.body_en) || (locale === 'ko' && ann.body_ko) || ann.body

  return (
    <div
      className="flex-shrink-0 rounded-xl p-3 flex flex-col gap-2"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        width: 240,
      }}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: cfg.border, color: cfg.color }}
          >
            {announcementLabels[ann.type]}
          </span>
          <span className="text-[10px] flex-shrink-0" style={{ color: '#636366' }}>
            {MONTH_SHORT[d.getMonth()]} {d.getDate()}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 -mt-0.5 -mr-0.5"
          style={{ color: '#636366' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* タイトル */}
      <p className="text-xs font-bold leading-snug" style={{ color: '#1C1C1E' }}>
        {title}
      </p>

      {/* 本文 */}
      <p className="text-[11px] leading-relaxed" style={{ color: '#636366' }}>
        {body}
      </p>

      {/* リンク */}
      {ann.url && (
        <a
          href={ann.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold"
          style={{ color: cfg.color }}
        >
          {t('Home.readMore')}
        </a>
      )}
    </div>
  )
}
