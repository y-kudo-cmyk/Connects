'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { useSupabaseData } from '@/components/SupabaseDataProvider'
import { scheduleTagConfig, type ScheduleTag } from '@/lib/config/tags'
import { useToday } from '@/lib/useToday'
import type { AppEvent } from '@/lib/supabase/adapters'
import EventDetailModal from '@/components/EventDetailModal'
import { countryFlag, cityToCountryCode } from '@/lib/countryUtils'

export default function NotificationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const TODAY = useToday()
  const { events, loading, refreshEvents } = useSupabaseData()
  const [detailEvent, setDetailEvent] = useState<AppEvent | null>(null)

  const type = searchParams.get('type') || 'morning'
  const date = searchParams.get('date') || TODAY
  const message = searchParams.get('message') || ''

  // 明日の日付
  const tomorrow = new Date(date + 'T00:00:00Z')
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  // 対象イベントを計算（TodayScheduleSectionと同じロジック）
  const todayEvents = events.filter(e => {
    if (e.dateEnd) return e.date <= date && e.dateEnd >= date
    return e.date === date
  })

  const tomorrowEvents = events.filter(e => {
    if (e.dateEnd) return e.date <= tomorrowStr && e.dateEnd >= tomorrowStr
    return e.date === tomorrowStr
  })

  const endingToday = events.filter(e => e.dateEnd === date && e.tags?.includes('TICKET'))

  const displayEvents = type === 'evening' ? tomorrowEvents : type === 'reminder' ? [] : todayEvents

  const title = type === 'morning'
    ? `📅 今日のスケジュール`
    : type === 'evening'
      ? `🌙 明日のスケジュール`
      : type === 'admin'
        ? `📢 運営からのお知らせ`
        : `⏰ まもなく開始`

  const subtitle = type === 'morning'
    ? `${date.replace(/-/g, '/')} · ${todayEvents.length}件`
    : type === 'evening'
      ? `${tomorrowStr.replace(/-/g, '/')} · ${tomorrowEvents.length}件`
      : type === 'admin'
        ? date.replace(/-/g, '/')
        : ''

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FA' }}>
      {/* ヘッダー */}
      <header className="px-4 pt-4 pb-3 flex items-center gap-3" style={{ background: '#FFFFFF', borderBottom: '1px solid #F0F0F5' }}>
        <button onClick={() => router.push('/')}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#F0F0F5' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: '#1C1C1E' }}>{title}</p>
          <p className="text-[10px]" style={{ color: '#8E8E93' }}>{subtitle}</p>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 flex flex-col gap-3">
        {/* 運営からのお知らせ */}
        {type === 'admin' && message && (
          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF' }}>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#1C1C1E' }}>
              {decodeURIComponent(message)}
            </p>
          </div>
        )}

        {/* 締切イベント（夜のみ） */}
        {type === 'evening' && endingToday.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: '#EF4444' }}>⏰ 今日締切</span>
            </div>
            {endingToday.map(event => {
              const tag = event.tags?.[0] as ScheduleTag | undefined
              const cfg = tag && scheduleTagConfig[tag] ? scheduleTagConfig[tag] : { icon: '📌', label: 'EVENT', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' }
              return (
                <button key={event.id} onClick={() => setDetailEvent(event)}
                  className="rounded-2xl p-4 flex items-center gap-3 text-left"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />
                  <div className="flex-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon} {cfg.label}</span>
                    <p className="text-sm font-bold mt-1" style={{ color: '#1C1C1E' }}>{event.title}</p>
                    {event.subTitle && <p className="text-xs" style={{ color: '#636366' }}>{event.subTitle}</p>}
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: '#EF4444' }}>締切</span>
                </button>
              )
            })}
            {tomorrowEvents.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold" style={{ color: '#636366' }}>📅 明日のスケジュール</span>
              </div>
            )}
          </>
        )}

        {/* イベント一覧 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-sm font-bold" style={{ color: '#8E8E93' }}>読み込み中...</span>
          </div>
        )}
        {!loading && displayEvents.length === 0 && type !== 'evening' && (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl mb-3">🎉</span>
            <p className="text-sm font-bold" style={{ color: '#8E8E93' }}>スケジュールはありません</p>
          </div>
        )}

        {displayEvents.map(event => {
          const tag = event.tags?.[0] as ScheduleTag | undefined
          const cfg = tag && scheduleTagConfig[tag] ? scheduleTagConfig[tag] : { icon: '📌', label: 'EVENT', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' }
          const isPeriod = event.dateEnd && event.dateEnd !== event.date
          return (
            <button key={event.id} onClick={() => setDetailEvent(event)}
              className="rounded-2xl overflow-hidden text-left" style={{ background: '#FFFFFF' }}>
              <div className="relative h-32 overflow-hidden">
                {event.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.image} alt="" className="w-full h-full object-cover object-top"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.removeAttribute('hidden') }} />
                ) : null}
                <div hidden={!!event.image} className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #E8D5F5 0%, #D5E5F5 50%, #F5D5E8 100%)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="" className="w-10 h-10 opacity-40" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon} {cfg.label}</span>
                  {event.time && event.time !== '00:00' && (
                    <span className="text-[10px] font-bold" style={{ color: '#8E8E93' }}>{event.time}</span>
                  )}
                  {isPeriod && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#F0F0F5', color: '#636366' }}>
                      ~{event.dateEnd?.replace(/-/g, '/').slice(5)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>
                  {event.title}{event.subTitle ? ` — ${event.subTitle}` : ''}
                </p>
                {(event.venue || event.city) && (
                  <div className="flex items-center gap-1 mt-1">
                    {event.city && (
                      <span style={{ fontSize: 12, lineHeight: 1 }}>{countryFlag(cityToCountryCode(event.city))}</span>
                    )}
                    <p className="text-xs truncate" style={{ color: '#8E8E93' }}>
                      {event.venue}{event.venue && event.city ? ' · ' : ''}{event.city}
                    </p>
                  </div>
                )}
                {event.sourceUrl && (
                  <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA' }}>
                    🔗 {event.sourceName || 'ソース'} ↗
                  </a>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* HOME に戻る */}
      <div className="px-4 pb-8">
        <button onClick={() => router.push('/')}
          className="w-full py-4 rounded-2xl text-sm font-bold"
          style={{ background: '#F3B4E3', color: '#FFFFFF' }}>
          HOME に戻る
        </button>
      </div>

      {detailEvent && (
        <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} onRefresh={refreshEvents} />
      )}
    </div>
  )
}
