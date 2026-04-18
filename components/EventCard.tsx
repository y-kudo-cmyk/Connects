import { useState } from 'react'
import { scheduleTagConfig, type ScheduleTag } from '@/lib/config/tags'
import type { AppEvent } from '@/lib/supabase/adapters'
import { VOTE_THRESHOLD } from '@/lib/supabase/useVoting'
import { countryFlag, cityToCountryCode } from '@/lib/countryUtils'
import { seventeenMembers } from '@/lib/config/constants'
import { useTranslations } from 'next-intl'

interface EventCardProps {
  event: AppEvent
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
  const [imgError, setImgError] = useState(false)
  const t = useTranslations()
  const firstTag = event.tags?.[0] as ScheduleTag | undefined
  const cfg = firstTag && scheduleTagConfig[firstTag] ? scheduleTagConfig[firstTag] : { label: 'EVENT', icon: '📌', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' }
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
              const tc = scheduleTagConfig[tag as ScheduleTag] ?? { label: tag, icon: '📌', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' }
              return (
                <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: tc.bg, color: tc.color }}>
                  {tc.icon} {tc.label}
                </span>
              )
            })}
            {event.cancelled && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                中止
              </span>
            )}
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={event.verifiedCount >= VOTE_THRESHOLD
                ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' }
                : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }
              }>
              {event.verifiedCount >= VOTE_THRESHOLD ? '✓' : `${event.verifiedCount}/${VOTE_THRESHOLD}`}
            </span>
          </div>
          <p className="text-[10px] leading-tight truncate mt-0.5" style={{ color: '#8E8E93' }}>
            {event.title}
          </p>
          {event.subTitle && (
            <p className="text-sm font-semibold leading-tight truncate" style={{ color: '#1C1C1E' }}>
              {event.subTitle}
            </p>
          )}
          <p className="text-[11px] mt-0.5" style={{ color: '#8E8E93' }}>
            {dateTime}{event.venue ? ` · ${event.venue}` : ''}
          </p>
          {event.relatedArtists && event.relatedArtists !== '#SEVENTEEN' && (
            <div className="flex flex-wrap gap-0.5 mt-0.5">
              {event.relatedArtists.split('#').map(s => s.trim()).filter(s => s && s !== 'SEVENTEEN').map(name => {
                const m = seventeenMembers.find(x => x.name === name)
                return (
                  <span key={name} className="text-[9px] font-bold px-1 py-0.5 rounded"
                    style={{ background: (m?.color ?? '#9A9A9F') + '18', color: m?.color ?? '#9A9A9F' }}>
                    #{name}
                  </span>
                )
              })}
            </div>
          )}
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
        {event.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #E8D5F5 0%, #D5E5F5 50%, #F5D5E8 100%)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="w-10 h-10 opacity-40" />
          </div>
        )}
        {/* タイプカラーライン */}
        <div className="absolute inset-y-0 right-0 w-0.5" style={{ background: cfg.color }} />
      </div>

      {/* 右：テキスト情報 */}
      <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-1 flex-wrap">
          {(event.tags ?? []).map((tag) => {
            const tc = scheduleTagConfig[tag as ScheduleTag] ?? { label: tag, icon: '📌', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' }
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
              {t('Common.period')}
            </span>
          )}
          {event.cancelled && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
              中止
            </span>
          )}
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={event.verifiedCount >= VOTE_THRESHOLD
              ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' }
              : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }
            }>
            {event.verifiedCount >= VOTE_THRESHOLD ? '✓' : `${event.verifiedCount}/${VOTE_THRESHOLD}`}
          </span>
        </div>
        <p className="text-[10px] leading-snug" style={{ color: '#8E8E93' }}>
          {event.title}
        </p>
        {event.subTitle && (
          <h3 className="text-sm font-semibold leading-snug" style={{ color: '#1C1C1E' }}>
            {event.subTitle}
          </h3>
        )}
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
        {event.relatedArtists && event.relatedArtists !== '#SEVENTEEN' && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {event.relatedArtists.split('#').map(s => s.trim()).filter(s => s && s !== 'SEVENTEEN').map(name => {
              const m = seventeenMembers.find(x => x.name === name)
              return (
                <span key={name} className="text-[9px] font-bold px-1 py-0.5 rounded"
                  style={{ background: (m?.color ?? '#9A9A9F') + '18', color: m?.color ?? '#9A9A9F' }}>
                  #{name}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
