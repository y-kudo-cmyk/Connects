'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { scheduleTagConfig, type ScheduleTag } from '@/lib/config/tags'
import { useSupabaseData } from './SupabaseDataProvider'
import type { AppEvent } from '@/lib/supabase/adapters'
import EventDetailModal from './EventDetailModal'

const DAY_JA = ['日', '月', '火', '水', '木', '金', '土']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function md(s: string) {
  const d = new Date(s)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export default function TodayScheduleSection({ today }: { today: string }) {
  const { events: allEvents } = useSupabaseData()
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
    // Sort: LIVE first, then today-only, then period
    return filtered.sort((a, b) => {
      const aIsLive = a.tags?.includes('LIVE') ? 0 : 1
      const bIsLive = b.tags?.includes('LIVE') ? 0 : 1
      if (aIsLive !== bIsLive) return aIsLive - bIsLive
      const aIsPeriod = a.dateEnd ? 1 : 0
      const bIsPeriod = b.dateEnd ? 1 : 0
      return aIsPeriod - bIsPeriod
    })
  }, [today])

  const d = new Date(today)
  const dayJa = DAY_JA[d.getDay()]
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
                {todayEvents.length}件
              </span>
            )}
            <Link
              href="/schedule"
              className="text-xs font-bold"
              style={{ color: '#636366' }}
            >
              すべて →
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
            <p className="text-sm" style={{ color: '#C7C7CC' }}>今日の予定はありません</p>
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
                : (hasTime ? `${md(event.date)} ${event.time}` : '終日')
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
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full" style={{ background: '#E5E5EA' }} />
                    )}
                    <div className="absolute inset-y-0 right-0 w-0.5" style={{ background: cfg.color }} />
                  </div>

                  {/* 右：情報 */}
                  <div className="flex-1 min-w-0 py-2.5 pr-3">
                    <div className="flex items-center gap-1 mb-1">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: cfg.bg ?? cfg.color + '20', color: cfg.color }}
                      >
                        {cfg.icon} {cfg.label}
                      </span>
                      {/* 承認バッジ */}
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={event.verifiedCount >= 3
                          ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' }
                          : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }
                        }
                      >
                        {event.verifiedCount >= 3 ? '✓' : `${event.verifiedCount}/3`}
                      </span>
                      {isPeriod && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(0,0,0,0.06)', color: '#8E8E93' }}
                        >
                          期間
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold leading-snug" style={{ color: '#1C1C1E' }}>
                      {event.title}
                    </p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: cfg.color }}>
                      {dateStr}
                    </p>
                    {(event.venue || event.city) && (
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: '#8E8E93' }}>
                        📍 {event.venue}{event.venue && event.city ? ' · ' : ''}{event.city}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {detailEvent && (
        <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} showConfirmButton={false} />
      )}
    </>
  )
}
