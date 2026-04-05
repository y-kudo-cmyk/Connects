'use client'

import { Event, tagConfig } from '@/lib/mockData'
import { useMyEntries } from '@/lib/useMyEntries'
import { countryFlag, cityToCountryCode } from '@/lib/countryUtils'

function md(s: string) {
  const d = new Date(s)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function formatDateTime(date: string, time: string, dateEnd?: string, timeEnd?: string): string {
  const hasTime = time && time !== '00:00'
  const start = `${md(date)}${hasTime ? ` ${time}` : ''}`
  if (!dateEnd) return start
  const endTime = timeEnd && timeEnd !== '00:00' ? ` ${timeEnd}` : ''
  return `${start} 〜 ${md(dateEnd)}${endTime}`
}

const DAY_JA = ['日', '月', '火', '水', '木', '金', '土']

export default function EventDetailModal({
  event,
  onClose,
  showConfirmButton = true,
}: {
  event: Event
  onClose: () => void
  showConfirmButton?: boolean
}) {
  const { addEntry, hasEntry } = useMyEntries()
  const firstTag = event.tags?.[0]
  const cfg = firstTag
    ? tagConfig[firstTag]
    : { label: 'EVENT', icon: '📌', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' }
  const isPeriod = !!event.dateEnd
  const dateTime = formatDateTime(event.date, event.time, event.dateEnd, event.timeEnd)
  const startD = new Date(event.date)
  const dayJa = DAY_JA[startD.getDay()]
  const imported = hasEntry(event.id)

  const handleAddToMy = () => {
    if (!imported) {
      addEntry({
        id: Date.now().toString(),
        date: event.date,
        dateEnd: event.dateEnd,
        eventId: event.id,
        title: event.title,
        type: event.type,
        color: event.artistColor,
        venue: event.venue,
        city: event.city,
        time: event.time,
        ticketImages: [],
        memo: '',
        images: [],
        createdAt: new Date().toISOString(),
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end"
      onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)' }}
      />
      <div
        className="relative flex flex-col rounded-t-2xl overflow-hidden"
        style={{ background: '#F8F9FA', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ドラッグハンドル */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>

        {/* ヘッダー */}
        <div className="flex items-start justify-between px-4 pt-1 pb-1 flex-shrink-0">
          <div className="flex-1 min-w-0" />
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* 画像 */}
          {event.image ? (
            <div className="rounded-2xl overflow-hidden mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image}
                alt={event.title}
                className="w-full rounded-2xl"
                style={{ display: 'block' }}
              />
            </div>
          ) : (
            <div
              className="rounded-2xl mb-4"
              style={{ aspectRatio: '16/9', background: '#E5E5EA' }}
            />
          )}

          {/* タグ */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {(event.tags ?? []).map((tag) => {
              const tc = tagConfig[tag]
              return (
                <span
                  key={tag}
                  className="text-[11px] font-bold px-2 py-1 rounded-lg"
                  style={{ background: tc.bg, color: tc.color }}
                >
                  {tc.icon} {tc.label}
                </span>
              )
            })}
            {isPeriod && (
              <span
                className="text-[11px] font-bold px-2 py-1 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.06)', color: '#8E8E93' }}
              >
                期間
              </span>
            )}
          </div>

          {/* タイトル */}
          <h2
            className="text-lg font-black leading-snug mb-2"
            style={{ color: '#1C1C1E' }}
          >
            {event.title}
          </h2>

          {/* 詳細情報 */}
          <div className="flex flex-col gap-3 mt-3">
            {/* 日程 */}
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.color + '15' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>
                  {dateTime}（{dayJa}）
                </p>
                {isPeriod && (
                  <p className="text-xs mt-0.5" style={{ color: '#8E8E93' }}>
                    {md(event.date)}〜{md(event.dateEnd!)}
                  </p>
                )}
              </div>
            </div>

            {/* 場所 */}
            {(event.venue || event.city) && (
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.color + '15' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="flex-1">
                  {event.venue && (
                    <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>
                      {event.venue}
                    </p>
                  )}
                  {event.city && (
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#8E8E93' }}>
                      <span>{countryFlag(cityToCountryCode(event.city))}</span>
                      {event.city}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ソース */}
            {event.sourceUrl && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.color + '15' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: cfg.color }}>
                    {event.sourceName ?? 'ソースを見る'}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: '#8E8E93' }}>
                    {event.sourceUrl}
                  </p>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div
          className={`px-4 pt-3 flex-shrink-0 ${showConfirmButton ? 'flex gap-3' : ''}`}
          style={{
            borderTop: '1px solid #E5E5EA',
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {showConfirmButton && (
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-xl text-sm font-bold min-h-[52px]"
              style={{ background: '#F0F0F5', color: '#636366' }}
            >
              確認
            </button>
          )}
          <button
            onClick={handleAddToMy}
            className={`${showConfirmButton ? 'flex-1' : 'w-full'} py-4 rounded-xl text-sm font-bold min-h-[52px]`}
            style={
              imported
                ? { background: 'rgba(243,180,227,0.15)', color: '#F3B4E3' }
                : { background: '#F3B4E3', color: '#FFFFFF' }
            }
          >
            {imported ? '✓ MYに追加済み' : '+ MYに追加'}
          </button>
        </div>
      </div>
    </div>
  )
}
