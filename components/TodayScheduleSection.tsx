'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { scheduleTagConfig, type ScheduleTag } from '@/lib/config/tags'
import { useSupabaseData } from './SupabaseDataProvider'
import type { AppEvent } from '@/lib/supabase/adapters'
import EventDetailModal from './EventDetailModal'
import { useTranslations } from 'next-intl'
import { useToday } from '@/lib/useToday'
import { useProfile } from '@/lib/useProfile'
import { cityToCountryCode, countryFlag } from '@/lib/countryUtils'
import { VOTE_THRESHOLD } from '@/lib/supabase/useVoting'

// DAY_JA は i18n の dayNames で置き換え
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function md(s: string) {
  const d = new Date(s)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export default function TodayScheduleSection() {
  const today = useToday()
  const { profile } = useProfile()
  const { events: allEvents, refreshEvents } = useSupabaseData()
  const t = useTranslations()
  const dayNames = t.raw('Calendar.dayNames') as string[]
  const [detailEvent, setDetailEvent] = useState<AppEvent | null>(null)

  const todayEvents = useMemo(() => {
    const filtered = allEvents.filter((e) => {
      if (e.dateEnd) {
        // 期間イベント: 開始日〜終了日の範囲内
        return e.date <= today && e.dateEnd >= today
      }
      // 単発: 当日のみ
      return e.date === today
    })
    // Sort priority: LIVE(home) → LIVE(overseas) → TICKET(home) → EVENT single(home) → other(home) → overseas → period
    const homeCountry = profile.country || 'JP'
    function sortKey(e: AppEvent): number {
      const isHome = (e.city || '') === homeCountry || !(e.city)
      const isPeriod = !!e.dateEnd
      const tag = e.tags?.[0] || ''
      if (tag === 'LIVE' && isHome) return 0
      if (tag === 'LIVE') return 1
      if (tag === 'TICKET' && isHome) return 2
      if (tag === 'EVENT' && isHome && !isPeriod) return 3
      if (isHome && !isPeriod) return 4
      if (isHome) return 5
      if (!isPeriod) return 6
      return 7
    }
    return filtered.sort((a, b) => sortKey(a) - sortKey(b))
  }, [today, allEvents])

  const d = new Date(today)
  const dayJa = dayNames[d.getDay()]
  const isSat = d.getDay() === 6
  const isSun = d.getDay() === 0

  return (
    <>
      <section className="px-4">
        {/* セクションヘッダー */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold tracking-widest mb-0.5" style={{ color: '#F3B4E3' }}>
              TODAY&apos;S SCHEDULE
            </p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-black" style={{ color: '#1C1C1E' }}>
                {MONTH_SHORT[d.getMonth()]} {d.getDate()}
              </h2>
              <span
                className="text-sm font-bold"
                style={{ color: isSun ? '#EF4444' : isSat ? '#3B82F6' : '#636366' }}
              >
                ({dayJa})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {todayEvents.length > 0 && (
              <span
                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {todayEvents.length}{t('Common.items')}
              </span>
            )}
            <Link
              href="/schedule"
              className="text-xs font-bold"
              style={{ color: '#636366' }}
            >
              {t('Common.seeAll')}
            </Link>
          </div>
        </div>

        {/* イベントリスト */}
        {todayEvents.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-8 rounded-2xl"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5" className="mb-2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p className="text-sm" style={{ color: '#C7C7CC' }}>{t('Home.noScheduleToday')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayEvents.map((event) => {
              const primaryTag = event.tags?.[0] as ScheduleTag | undefined
              const cfg = primaryTag && scheduleTagConfig[primaryTag] ? scheduleTagConfig[primaryTag] : { label: 'EVENT', icon: '📌', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' }
              const isPeriod = !!event.dateEnd
              const hasTime = event.time && event.time !== '00:00'
              const dateStr = isPeriod
                ? `${md(event.date)}${hasTime ? ` ${event.time}` : ''} 〜 ${md(event.dateEnd!)}${event.timeEnd && event.timeEnd !== '00:00' ? ` ${event.timeEnd}` : ''}`
                : (hasTime ? `${md(event.date)} ${event.time}` : t('Common.allDay'))
              return (
                <button
                  key={event.id}
                  onClick={() => setDetailEvent(event)}
                  className="flex items-center gap-3 rounded-2xl overflow-hidden text-left"
                  style={{ background: '#FFFFFF', minHeight: 80 }}
                >
                  {/* 左：画像 */}
                  <div className="flex-shrink-0 relative overflow-hidden" style={{ width: 72, alignSelf: 'stretch' }}>
                    {event.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.image} alt={event.title}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                          target.parentElement!.querySelector('[data-fallback]')!.removeAttribute('hidden')
                        }}
                      />
                    ) : null}
                    <div data-fallback className="w-full h-full flex items-center justify-center"
                      hidden={!!event.image}
                      style={{ background: 'linear-gradient(135deg, #E8D5F5 0%, #D5E5F5 50%, #F5D5E8 100%)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.png" alt="" className="w-8 h-8 opacity-40" />
                    </div>
                    <div className="absolute inset-y-0 right-0 w-0.5" style={{ background: cfg.color }} />
                  </div>

                  {/* 右：情報 */}
                  <div className="flex-1 min-w-0 py-2.5 pr-3">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: cfg.bg ?? cfg.color + '20', color: cfg.color }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={event.verifiedCount >= VOTE_THRESHOLD
                          ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' }
                          : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }
                        }>
                        {event.verifiedCount >= VOTE_THRESHOLD ? '✓' : `${event.verifiedCount}/${VOTE_THRESHOLD}`}
                      </span>
                      {isPeriod && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(0,0,0,0.06)', color: '#8E8E93' }}>
                          {t('Common.period')}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] leading-snug" style={{ color: '#8E8E93' }}>
                      {event.title}
                    </p>
                    {event.subTitle && (
                      <p className="text-sm font-semibold leading-snug" style={{ color: '#1C1C1E' }}>
                        {event.subTitle}
                      </p>
                    )}
                    <p className="text-xs font-semibold mt-0.5" style={{ color: cfg.color }}>
                      {dateStr}
                    </p>
                    {(event.venue || event.city) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {event.city && (
                          <span style={{ fontSize: 12, lineHeight: 1 }}>
                            {countryFlag(cityToCountryCode(event.city))}
                          </span>
                        )}
                        <p className="text-[11px] truncate" style={{ color: '#8E8E93' }}>
                          {event.venue}{event.venue && event.city ? ' · ' : ''}{event.city}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {detailEvent && (
        <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} onRefresh={refreshEvents} showConfirmButton />
      )}
    </>
  )
}
