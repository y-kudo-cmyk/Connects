'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { useSupabaseData } from '@/components/SupabaseDataProvider'
import { scheduleTagConfig, type ScheduleTag } from '@/lib/config/tags'
import { useToday } from '@/lib/useToday'
import type { AppEvent } from '@/lib/supabase/adapters'
import EventDetailModal from '@/components/EventDetailModal'

export default function NotificationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const TODAY = useToday()
  const { events } = useSupabaseData()
  const [detailEvent, setDetailEvent] = useState<AppEvent | null>(null)

  const type = searchParams.get('type') || 'morning'
  const date = searchParams.get('date') || TODAY

  // 明日の日付
  const tomorrow = new Date(date + 'T00:00:00Z')
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  // 対象イベントを計算
  const todayEvents = events.filter(e => {
    const start = e.date
    const end = e.dateEnd || start
    return start <= date && date <= end
  })

  const tomorrowEvents = events.filter(e => {
    const start = e.date
    const end = e.dateEnd || start
    return start <= tomorrowStr && tomorrowStr <= end
  })

  const endingToday = events.filter(e => e.dateEnd === date && e.tags?.includes('TICKET'))

  const displayEvents = type === 'evening' ? tomorrowEvents : type === 'reminder' ? [] : todayEvents

  const title = type === 'morning'
    ? `📅 今日のスケジュール`
    : type === 'evening'
      ? `🌙 明日のスケジュール`
      : `⏰ まもなく開始`

  const subtitle = type === 'morning'
    ? `${date.replace(/-/g, '/')} · ${todayEvents.length}件`
    : type === 'evening'
      ? `${tomorrowStr.replace(/-/g, '/')} · ${tomorrowEvents.length}件`
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
        {displayEvents.length === 0 && type !== 'evening' && (
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
              {event.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.image} alt="" className="w-full h-32 object-cover object-top" />
              )}
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
                {event.venue && (
                  <p className="text-xs mt-1" style={{ color: '#8E8E93' }}>📍 {event.venue}</p>
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
        <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />
      )}
    </div>
  )
}
