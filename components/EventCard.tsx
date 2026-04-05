import { Event, tagConfig } from '@/lib/mockData'
import { countryFlag, cityToCountryCode } from '@/lib/countryUtils'

interface EventCardProps {
  event: Event
  compact?: boolean
}

// MM/DD形式
function md(s: string) {
  const d = new Date(s)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// 日付＋時間を1行で: "02/25 14:00" or "02/25 14:00 〜 02/27 23:59"
function formatDateTime(date: string, time: string, dateEnd?: string, timeEnd?: string): string {
  const hasTime = time && time !== '00:00'
  const start = `${md(date)}${hasTime ? ` ${time}` : ''}`
  if (!dateEnd) return start
  const endTime = timeEnd && timeEnd !== '00:00' ? ` ${timeEnd}` : ''
  return `${start} 〜 ${md(dateEnd)}${endTime}`
}

export default function EventCard({ event, compact = false }: EventCardProps) {
  const firstTag = event.tags?.[0]
  const cfg = firstTag ? tagConfig[firstTag] : { label: 'EVENT', icon: '📌', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' }
  const isPeriod = !!event.dateEnd
  const dateTime = formatDateTime(event.date, event.time, event.dateEnd, event.timeEnd)

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl px-3 py-2.5"
        style={{ background: '#FFFFFF', borderLeft: `3px solid ${cfg.color}` }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{ background: event.artistColor + '25', color: event.artistColor }}
        >
          {event.artist.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            {(event.tags ?? []).map((tag) => {
              const tc = tagConfig[tag]
              return (
                <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: tc.bg, color: tc.color }}>
                  {tc.icon} {tc.label}
                </span>
              )
            })}
          </div>
          <p className="text-sm font-semibold leading-tight truncate mt-0.5" style={{ color: '#1C1C1E' }}>
            {event.title}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: '#8E8E93' }}>
            {dateTime}{event.venue ? ` · ${event.venue}` : ''}
          </p>
        </div>
        {event.city && (
          <span style={{ fontSize: 14 }}>
            {countryFlag(cityToCountryCode(event.city))}
          </span>
        )}
      </div>
    )
  }

  // フル表示 — 横並び（左=画像、右=情報）
  return (
    <div className="rounded-2xl overflow-hidden flex" style={{ background: '#FFFFFF', minHeight: 104 }}>
      {/* 左：画像 */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 88 }}>
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
        {/* タイプカラーライン */}
        <div className="absolute inset-y-0 right-0 w-0.5" style={{ background: cfg.color }} />
      </div>

      {/* 右：テキスト情報 */}
      <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-1 flex-wrap">
          {(event.tags ?? []).map((tag) => {
            const tc = tagConfig[tag]
            return (
              <span key={tag}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: tc.bg, color: tc.color }}>
                {tc.icon} {tc.label}
              </span>
            )
          })}
          {isPeriod && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.06)', color: '#8E8E93' }}
            >
              期間
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold leading-snug" style={{ color: '#1C1C1E' }}>
          {event.title}
        </h3>
        <p className="text-xs font-semibold" style={{ color: cfg.color }}>{dateTime}</p>
        {(event.venue || event.city) && (
          <div className="flex items-center gap-1">
            {event.city ? (
              <span style={{ fontSize: 12, lineHeight: 1 }}>
                {countryFlag(cityToCountryCode(event.city))}
              </span>
            ) : null}
            <span className="text-[11px] truncate" style={{ color: '#8E8E93' }}>
              {event.venue}{event.venue && event.city ? ' · ' : ''}{event.city}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
