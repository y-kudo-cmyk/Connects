'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { events, eventTypeConfig } from '@/lib/mockData'

const DAY_JA = ['日', '月', '火', '水', '木', '金', '土']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function TodayScheduleSection({ today }: { today: string }) {
  const todayEvents = useMemo(
    () => events.filter((e) => e.date <= today && (!e.dateEnd || e.dateEnd >= today)),
    [today]
  )

  const d = new Date(today)
  const dayJa = DAY_JA[d.getDay()]
  const isSat = d.getDay() === 6
  const isSun = d.getDay() === 0

  return (
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
            const cfg = eventTypeConfig[event.type]
            const isPeriod = !!event.dateEnd
            return (
              <Link
                key={event.id}
                href={`/schedule?event=${event.id}`}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl"
                style={{ background: '#FFFFFF', borderLeft: `3px solid ${cfg.color}` }}
              >
                {/* 時刻 or 期間バッジ */}
                <div className="flex-shrink-0 w-12 text-center">
                  {isPeriod ? (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded"
                      style={{ background: cfg.color + '30', color: cfg.color }}
                    >
                      開催中
                    </span>
                  ) : (
                    <span className="text-xs font-bold" style={{ color: cfg.color }}>
                      {event.time === '00:00' ? '終日' : event.time}
                    </span>
                  )}
                </div>

                {/* 情報 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1E' }}>
                    {event.title}
                  </p>
                  {(event.venue || event.city) && (
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: '#636366' }}>
                      📍 {event.venue}{event.venue && event.city ? ' · ' : ''}{event.city}
                    </p>
                  )}
                </div>

                {/* タイプバッジ */}
                <span
                  className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg"
                  style={{ background: cfg.color + '20', color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
