'use client'

import { useState, useEffect } from 'react'
import { Announcement, useAnnouncements } from '@/lib/useAnnouncements'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/lib/supabase/useAuth'
import { createClient } from '@/lib/supabase/client'
import ConcertCampaignModal from '@/components/ConcertCampaignModal'
import Link from 'next/link'

const TYPE_CONFIG = {
  important: { bg: '#FFF0F8', border: '#F3B4E3', color: '#C97AB8' },
  warning:   { bg: '#FFFBEB', border: '#FCD34D', color: '#B45309' },
  info:      { bg: '#EFF6FF', border: '#93C5FD', color: '#1D4ED8' },
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AnnouncementsSection({ announcements }: { announcements: Announcement[] }) {
  const t = useTranslations()
  const { visible, dismiss } = useAnnouncements(announcements)
  const { user } = useAuth()
  const [campaignDone, setCampaignDone] = useState(true) // default hidden until checked
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    setCampaignDone(localStorage.getItem('cp-campaign-concert-done') === 'true')
  }, [])

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.role) setUserRole(data.role) })
  }, [user?.id])

  const handleCampaignComplete = () => {
    localStorage.setItem('cp-campaign-concert-done', 'true')
    setCampaignDone(true)
  }

  // admin / fam に参戦記録キャンペーン表示 (admin は再テスト用に常時表示)
  const isAdmin = userRole === 'admin'
  const isFam = userRole === 'fam'
  const showCampaign = (isAdmin || isFam) && (!campaignDone || isAdmin)
  const totalCount = visible.length + (showCampaign ? 1 : 0)

  if (totalCount === 0) return null

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
          {totalCount}{t('Common.items')}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {showCampaign && (
          <CampaignCard onTap={() => setCampaignModalOpen(true)} />
        )}
        {visible.map((ann) => (
          <AnnouncementCard key={ann.id} ann={ann} onDismiss={() => dismiss(ann.id)} />
        ))}
      </div>

      <ConcertCampaignModal
        open={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        onComplete={handleCampaignComplete}
      />
    </section>
  )
}

function CampaignCard({ onTap }: { onTap: () => void }) {
  const t = useTranslations('Campaign')
  return (
    <button
      onClick={onTap}
      className="flex-shrink-0 rounded-xl p-3 flex flex-col gap-2 text-left"
      style={{
        background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #F97316 100%)',
        width: 240,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.25)', color: '#FFF' }}>
          Campaign
        </span>
      </div>
      <p className="text-xs font-bold leading-snug text-white">
        {t('cardTitle')}
      </p>
      <p className="text-[11px] leading-relaxed text-white/80">
        {t('cardSubtitle')}
      </p>
    </button>
  )
}

function AnnouncementCard({ ann, onDismiss }: { ann: Announcement; onDismiss: () => void }) {
  const t = useTranslations()
  const locale = useLocale()
  const announcementLabels = t.raw('Home.announcementTypes') as Record<string, string>
  const cfg = TYPE_CONFIG[ann.type]
  const d = new Date(ann.date)

  // locale に応じてタイトルを切り替え（翻訳が空なら日本語にフォールバック）
  const title = (locale === 'en' && ann.title_en) || (locale === 'ko' && ann.title_ko) || ann.title

  return (
    <div
      className="relative flex-shrink-0 rounded-xl"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        width: 240,
      }}
    >
      <Link
        href={`/${locale}/info/${ann.id}`}
        className="block p-3"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <div className="flex items-center gap-1.5 mb-1.5 pr-6">
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
        <p
          className="text-xs font-bold leading-snug"
          style={{
            color: '#1C1C1E',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </p>
        <p className="text-[10px] font-bold mt-2" style={{ color: cfg.color }}>
          {t('Home.readMore')} ＞
        </p>
      </Link>
      <button
        onClick={onDismiss}
        className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full"
        style={{ color: '#636366' }}
        aria-label="dismiss"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
