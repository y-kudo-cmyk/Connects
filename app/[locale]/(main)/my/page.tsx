'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { useMyEntries, MyEntry, compressImage, SeatInfo } from '@/lib/useMyEntries'
import { eventTypeConfig } from '@/lib/config/constants'
import { scheduleTagConfig, type ScheduleTag } from '@/lib/config/tags'
import { countryFlag } from '@/lib/countryUtils'
import { useTranslations } from 'next-intl'
import { usePageView } from '@/lib/useActivityLog'
import SeatInfoForm from '@/components/SeatInfoForm'
import SeatViewPreview from '@/components/SeatViewPreview'
import TodoSection from '@/components/TodoSection'
import { useToday } from '@/lib/useToday'

// ── 日付ヘルパー ─────────────────────────────────────────────────
function md(s: string) {
  const d = new Date(s)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function fmtDateRange(date: string, time?: string, dateEnd?: string, timeEnd?: string): string {
  const hasTime = time && time !== '00:00'
  const start = `${md(date)}${hasTime ? ` ${time}` : ''}`
  if (!dateEnd) return start
  const hasEndTime = timeEnd && timeEnd !== '00:00'
  return `${start} 〜 ${md(dateEnd)}${hasEndTime ? ` ${timeEnd}` : ''}`
}

// ── 時間グリッド定数 ──────────────────────────────────────────────
const HOUR_H = 56
const TIME_W = 52
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function timeToY(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h + m / 60) * HOUR_H
}

function getWeekDates(anchor: string): string[] {
  const d = new Date(anchor)
  const sun = new Date(d)
  sun.setDate(d.getDate() - d.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(sun)
    dd.setDate(sun.getDate() + i)
    return dd.toISOString().slice(0, 10)
  })
}

// ── カレンダーヘルパー ────────────────────────────────────────────
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay() }

const FULL_MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['S','M','T','W','T','F','S']
// DAY_SHORT は t.raw('Calendar.dayNames') に置き換え

// ── メインページ ─────────────────────────────────────────────────
export default function MyPage() {
  usePageView('my')
  const TODAY = useToday()
  const now = new Date()
  const [tab, setTab] = useState<'entries' | 'todos'>('entries')
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [weekAnchor, setWeekAnchor] = useState(TODAY)
  const [editEntry, setEditEntry] = useState<MyEntry | null>(null)
  const [tagFilter, setTagFilter] = useState<string | 'ALL'>('ALL')
  const gridRef = useRef<HTMLDivElement>(null)

  const searchParams = useSearchParams()
  const { entries, addEntry, updateEntry, removeEntry } = useMyEntries()
  const [showAddModal, setShowAddModal] = useState(false)
  const t = useTranslations()
  const DAY_SHORT = t.raw('Calendar.dayNames') as string[]

  // クエリパラメータ ?entry=<id> でエントリ編集モーダルを自動オープン
  useEffect(() => {
    const entryId = searchParams.get('entry')
    if (entryId && entries.length > 0 && !editEntry) {
      const target = entries.find((e) => e.id === entryId)
      if (target) setEditEntry(target)
    }
  }, [searchParams, entries])

  // 週/日ビューに切り替えたとき現在時刻にスクロール
  useEffect(() => {
    if (viewMode === 'week' || viewMode === 'day') {
      const h = new Date().getHours()
      const targetY = h * HOUR_H - 80
      setTimeout(() => {
        gridRef.current?.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
      }, 50)
    }
  }, [viewMode])

  // タグフィルター適用
  const filteredEntries = tagFilter === 'ALL'
    ? entries
    : entries.filter((e) => e.tags?.includes(tagFilter))

  // MYエントリに存在するタグ一覧
  const usedTags = Array.from(new Set(entries.flatMap((e) => e.tags ?? [])))

  // ── 月ビュー用 ──────────────────────────────────────────────────
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }
  const daysCount = getDaysInMonth(year, month)
  const firstDay = getFirstDay(year, month)
  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  // エントリが持つ日付 → タグ色のマップ（期間エントリは全日をカバー）
  const entryDateColors = new Map<string, string[]>()
  for (const e of filteredEntries) {
    const color = e.tags?.[0] && scheduleTagConfig[e.tags[0] as ScheduleTag]
      ? scheduleTagConfig[e.tags[0] as ScheduleTag].color
      : e.color || '#F3B4E3'
    const addDate = (ds: string) => {
      const existing = entryDateColors.get(ds) ?? []
      if (!existing.includes(color)) entryDateColors.set(ds, [...existing, color])
    }
    if (!e.dateEnd) {
      addDate(e.customDate ?? e.date)
    } else {
      const cur = new Date(e.date)
      const end = new Date(e.dateEnd)
      while (cur <= end) {
        addDate(cur.toISOString().slice(0, 10))
        cur.setDate(cur.getDate() + 1)
      }
    }
  }

  // 選択日のエントリ (LIVE→TICKET→MERCH→other→period)
  const dayEntries = filteredEntries.filter((e) => {
    if (e.dateEnd) return e.date <= selectedDate && selectedDate <= e.dateEnd
    return (e.customDate ?? e.date) === selectedDate
  }).sort((a, b) => {
    function sortKey(e: typeof a): number {
      const tag = e.tags?.[0] || ''
      const isPeriod = !!e.dateEnd
      if (tag === 'CONCERT') return 0
      if (tag === 'TICKET') return 1
      if (tag === 'MERCH') return 2
      if (!isPeriod) return 3
      return 4
    }
    return sortKey(a) - sortKey(b)
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Header */}
      <div className="px-4"
        style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', paddingBottom: 8, background: '#F8F9FA' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-wider" style={{ color: '#1C1C1E' }}>MY</h1>
            {tab === 'entries' && (
              <button onClick={() => setShowAddModal(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#F3B4E3' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </div>
          {tab === 'entries' && (
            <div className="flex rounded-lg p-0.5" style={{ background: '#EFEFEF' }}>
              {(['month', 'week', 'day'] as const).map((v) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className="px-3 py-1.5 rounded-md text-[11px] font-bold"
                  style={viewMode === v
                    ? { background: '#F3B4E3', color: '#FFFFFF' }
                    : { color: '#8E8E93' }
                  }>
                  {v === 'month' ? t('My.viewMonth') : v === 'week' ? t('My.viewWeek') : t('My.viewDay')}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Tab switcher */}
        <div className="flex mt-3 rounded-xl p-0.5" style={{ background: '#EFEFEF' }}>
          <button onClick={() => setTab('entries')}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
            style={tab === 'entries'
              ? { background: '#FFFFFF', color: '#1C1C1E' }
              : { color: '#8E8E93' }
            }>
            {t('Schedule.scheduleRecord')}
          </button>
          <button onClick={() => setTab('todos')}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
            style={tab === 'todos'
              ? { background: '#FFFFFF', color: '#1C1C1E' }
              : { color: '#8E8E93' }
            }>
            TODO
          </button>
        </div>
      </div>

      {/* ── TODO タブ ── */}
      {tab === 'todos' && <TodoSection />}

      {/* ── スケジュール記録タブ ── */}
      {tab === 'entries' && (
        <>
          {/* 月ビュー */}
          {viewMode === 'month' && (
            <div className="px-4 pt-2">
              {/* 月ナビ */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth}
                  className="w-11 h-11 flex items-center justify-center rounded-full"
                  style={{ background: '#FFFFFF' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="text-base font-bold" style={{ color: '#1C1C1E' }}>
                  {FULL_MONTH[month]} {year}
                </span>
                <button onClick={nextMonth}
                  className="w-11 h-11 flex items-center justify-center rounded-full"
                  style={{ background: '#FFFFFF' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
              {/* 曜日ヘッダー */}
              <div className="grid grid-cols-7 mb-2">
                {DAY_NAMES.map((d, i) => (
                  <div key={i} className="text-center text-[11px] font-semibold py-1"
                    style={{ color: i === 0 ? '#EF4444' : i === 6 ? '#60A5FA' : '#6B6B70' }}>
                    {d}
                  </div>
                ))}
              </div>
              {/* カレンダーグリッド */}
              <div className="grid grid-cols-7 gap-y-1 mb-4">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysCount }).map((_, i) => {
                  const day = i + 1
                  const ds = fmt(year, month, day)
                  const isSelected = ds === selectedDate
                  const isToday = ds === TODAY
                  const hasEntry = entryDateColors.has(ds)
                  return (
                    <button key={day} onClick={() => setSelectedDate(ds)}
                      className="flex flex-col items-center py-2 rounded-lg"
                      style={{ background: isSelected ? '#F3B4E3' : 'transparent' }}>
                      <span className="text-sm w-7 h-7 flex items-center justify-center rounded-full"
                        style={{
                          color: isSelected ? '#F8F9FA' : isToday ? '#F3B4E3' : '#1C1C1E',
                          fontWeight: isToday || isSelected ? 700 : 400,
                        }}>
                        {day}
                      </span>
                      {hasEntry && (
                        <span className="w-1 h-1 rounded-full mt-0.5"
                          style={{ background: isSelected ? '#F8F9FA' : '#F3B4E3' }} />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* タグフィルター（カレンダー下） */}
              <div className="mb-4">
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  <button onClick={() => setTagFilter('ALL')}
                    className="flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold min-h-[44px]"
                    style={tagFilter === 'ALL'
                      ? { background: '#F3B4E3', color: '#F8F9FA' }
                      : { background: '#FFFFFF', color: '#636366' }
                    }>ALL</button>
                  {(Object.entries(scheduleTagConfig) as [ScheduleTag, typeof scheduleTagConfig[ScheduleTag]][]).map(([key, tc]) => (
                    <button key={key} onClick={() => setTagFilter(key)}
                      className="flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold min-h-[44px]"
                      style={tagFilter === key
                        ? { background: tc.color, color: '#F8F9FA' }
                        : { background: tc.bg, color: tc.color }
                      }>{tc.icon} {tc.label}</button>
                  ))}
                </div>
              </div>

              {/* 選択日のエントリ */}
              <div className="pb-28">
                <p className="text-xs font-semibold mb-3" style={{ color: '#8E8E93' }}>
                  {md(selectedDate)} · {dayEntries.length}{t('Common.items')}
                </p>
                {dayEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10" style={{ color: '#8E8E93' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mb-2 opacity-40">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p className="text-sm">{t('My.noRecordThisDay')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {dayEntries.map((entry) => (
                      <EntryCard key={entry.id} entry={entry}
                        onEdit={() => setEditEntry(entry)}
                        onRemove={() => removeEntry(entry.id)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 週ビュー */}
          {viewMode === 'week' && (() => {
            const weekDates = getWeekDates(weekAnchor)
            const allDayEntries = filteredEntries.filter((e) => !e.time || e.time === '00:00')
            const timedEntries = filteredEntries.filter((e) => e.time && e.time !== '00:00')
            const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
            const todayColIdx = weekDates.indexOf(TODAY)

            return (
              <div className="flex flex-col" style={{ height: 'calc(100vh - 148px)' }}>
                {/* 週ナビ */}
                <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
                  <button onClick={() => {
                    const d = new Date(weekAnchor); d.setDate(d.getDate() - 7)
                    setWeekAnchor(d.toISOString().slice(0, 10))
                  }} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: '#FFFFFF' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <span className="text-sm font-bold" style={{ color: '#1C1C1E' }}>
                    {md(weekDates[0])} 〜 {md(weekDates[6])}
                  </span>
                  <button onClick={() => {
                    const d = new Date(weekAnchor); d.setDate(d.getDate() + 7)
                    setWeekAnchor(d.toISOString().slice(0, 10))
                  }} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: '#FFFFFF' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>

                {/* 曜日ヘッダー */}
                <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid #E5E5EA' }}>
                  <div style={{ width: TIME_W, flexShrink: 0 }} />
                  {weekDates.map((ds, i) => {
                    const day = parseInt(ds.slice(8))
                    const isToday = ds === TODAY
                    return (
                      <div key={ds} className="flex-1 flex flex-col items-center py-1.5">
                        <span className="text-[10px] font-semibold"
                          style={{ color: i === 0 ? '#EF4444' : i === 6 ? '#60A5FA' : '#8E8E93' }}>
                          {DAY_SHORT[i]}
                        </span>
                        <span className="text-sm w-7 h-7 flex items-center justify-center rounded-full font-bold"
                          style={isToday
                            ? { background: '#F3B4E3', color: '#FFFFFF' }
                            : { color: '#1C1C1E' }
                          }>
                          {day}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* 終日エントリ行 */}
                {allDayEntries.length > 0 && (
                  <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid #E5E5EA', minHeight: 28 }}>
                    <div style={{ width: TIME_W, flexShrink: 0 }}
                      className="flex items-center justify-end pr-2">
                      <span className="text-[9px]" style={{ color: '#8E8E93' }}>{t('Common.allDay')}</span>
                    </div>
                    {weekDates.map((ds) => {
                      const dayADE = allDayEntries.filter((e) =>
                        e.dateEnd
                          ? e.date <= ds && ds <= e.dateEnd
                          : (e.customDate ?? e.date) === ds
                      )
                      return (
                        <div key={ds} className="flex-1 py-0.5 px-0.5 flex flex-col gap-0.5">
                          {dayADE.map((e) => {
                            const cfg = eventTypeConfig[e.type as keyof typeof eventTypeConfig]
                            const col = cfg?.color ?? e.color
                            return (
                              <button key={e.id} onClick={() => setEditEntry(e)}
                                className="w-full px-1 py-0.5 rounded text-[9px] font-bold truncate text-left"
                                style={{ background: col + '25', color: col }}>
                                {e.title}
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 時間グリッド */}
                <div ref={gridRef} className="flex-1 overflow-y-auto">
                  <div className="flex relative" style={{ height: HOUR_H * 24 }}>
                    {/* 時間ラベル */}
                    <div className="flex-shrink-0 relative" style={{ width: TIME_W }}>
                      {HOURS.map((h) => (
                        <div key={h} className="absolute flex items-start justify-end pr-2"
                          style={{ top: h * HOUR_H - 8, height: HOUR_H, width: TIME_W }}>
                          {h > 0 && (
                            <span className="text-[10px]" style={{ color: '#8E8E93' }}>
                              {String(h).padStart(2, '0')}:00
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* グリッド + イベント */}
                    <div className="flex-1 relative">
                      {/* 時間線 */}
                      {HOURS.map((h) => (
                        <div key={h} className="absolute left-0 right-0"
                          style={{ top: h * HOUR_H, borderTop: h === 0 ? 'none' : '1px solid #F0F0F5' }} />
                      ))}
                      {/* 列区切り */}
                      {[1,2,3,4,5,6].map((i) => (
                        <div key={i} className="absolute top-0 bottom-0"
                          style={{ left: `${(i / 7) * 100}%`, borderLeft: '1px solid #F0F0F5' }} />
                      ))}
                      {/* 現在時刻線 */}
                      {todayColIdx >= 0 && (
                        <div className="absolute left-0 right-0 flex items-center pointer-events-none"
                          style={{ top: timeToY(nowStr), zIndex: 5 }}>
                          <div style={{
                            width: `${(todayColIdx / 7) * 100}%`,
                            borderTop: '1.5px solid rgba(239,68,68,0.3)',
                          }} />
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />
                          <div className="flex-1" style={{ borderTop: '1.5px solid #EF4444' }} />
                        </div>
                      )}
                      {/* イベントブロック */}
                      {weekDates.map((ds, colIdx) => {
                        const colEntries = timedEntries.filter((e) =>
                          e.dateEnd
                            ? e.date <= ds && ds <= e.dateEnd
                            : (e.customDate ?? e.date) === ds
                        )
                        return colEntries.map((e) => {
                          const cfg = eventTypeConfig[e.type as keyof typeof eventTypeConfig]
                          const col = cfg?.color ?? e.color
                          const t = e.customTime ?? e.time ?? '00:00'
                          const colW = 100 / 7
                          return (
                            <button key={`${ds}-${e.id}`} onClick={() => setEditEntry(e)}
                              className="absolute rounded text-left overflow-hidden leading-tight"
                              style={{
                                top: timeToY(t),
                                left: `${colIdx * colW + 0.3}%`,
                                width: `${colW - 0.6}%`,
                                minHeight: 22,
                                background: col + '25',
                                color: col,
                                border: `1px solid ${col}50`,
                                padding: '2px 3px',
                                zIndex: 4,
                              }}>
                              <span className="block truncate text-[9px] font-bold">{e.title}</span>
                              <span className="block text-[9px] opacity-75">{t}</span>
                            </button>
                          )
                        })
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 日ビュー */}
          {viewMode === 'day' && (() => {
            const timedE = filteredEntries.filter((e) => {
              const t = e.customTime ?? e.time
              if (!t || t === '00:00') return false
              if (e.dateEnd) return e.date <= selectedDate && selectedDate <= e.dateEnd
              return (e.customDate ?? e.date) === selectedDate
            })
            const allDayE = filteredEntries.filter((e) => {
              const t = e.customTime ?? e.time
              if (t && t !== '00:00') return false
              if (e.dateEnd) return e.date <= selectedDate && selectedDate <= e.dateEnd
              return (e.customDate ?? e.date) === selectedDate
            })
            const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

            return (
              <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
                {/* 日ナビ */}
                <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
                  <button onClick={() => {
                    const d = new Date(selectedDate); d.setDate(d.getDate() - 1)
                    setSelectedDate(d.toISOString().slice(0, 10))
                  }} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: '#FFFFFF' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <span className="text-sm font-bold" style={{ color: '#1C1C1E' }}>
                    {md(selectedDate)}（{DAY_SHORT[new Date(selectedDate).getDay()]}）
                  </span>
                  <button onClick={() => {
                    const d = new Date(selectedDate); d.setDate(d.getDate() + 1)
                    setSelectedDate(d.toISOString().slice(0, 10))
                  }} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: '#FFFFFF' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>

                {/* 終日エントリ */}
                {allDayE.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 pb-2 flex-shrink-0"
                    style={{ borderBottom: '1px solid #E5E5EA' }}>
                    <span className="text-[10px] self-center" style={{ color: '#8E8E93' }}>{t('Common.allDay')}</span>
                    {allDayE.map((e) => {
                      const cfg = eventTypeConfig[e.type as keyof typeof eventTypeConfig]
                      const col = cfg?.color ?? e.color
                      return (
                        <button key={e.id} onClick={() => setEditEntry(e)}
                          className="px-2 py-1 rounded text-xs font-bold"
                          style={{ background: col + '25', color: col }}>
                          {e.title}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* 時間グリッド */}
                <div ref={gridRef} className="flex-1 overflow-y-auto">
                  <div className="flex relative" style={{ height: HOUR_H * 24 }}>
                    {/* 時間ラベル */}
                    <div className="flex-shrink-0 relative" style={{ width: TIME_W }}>
                      {HOURS.map((h) => (
                        <div key={h} className="absolute flex items-start justify-end pr-2"
                          style={{ top: h * HOUR_H - 8, height: HOUR_H, width: TIME_W }}>
                          {h > 0 && (
                            <span className="text-[10px]" style={{ color: '#8E8E93' }}>
                              {String(h).padStart(2, '0')}:00
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* グリッド列 */}
                    <div className="flex-1 relative">
                      {HOURS.map((h) => (
                        <div key={h} className="absolute left-0 right-0"
                          style={{ top: h * HOUR_H, borderTop: h === 0 ? 'none' : '1px solid #F0F0F5' }} />
                      ))}
                      {/* 現在時刻線 */}
                      {selectedDate === TODAY && (
                        <div className="absolute left-0 right-0 flex items-center pointer-events-none"
                          style={{ top: timeToY(nowStr), zIndex: 5 }}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />
                          <div className="flex-1" style={{ borderTop: '1.5px solid #EF4444' }} />
                        </div>
                      )}
                      {/* イベントブロック */}
                      {timedE.map((e) => {
                        const cfg = eventTypeConfig[e.type as keyof typeof eventTypeConfig]
                        const col = cfg?.color ?? e.color
                        const t = e.customTime ?? e.time ?? '00:00'
                        return (
                          <button key={e.id} onClick={() => setEditEntry(e)}
                            className="absolute left-1 right-2 rounded-lg text-left overflow-hidden leading-snug"
                            style={{
                              top: timeToY(t),
                              minHeight: 36,
                              background: col + '25',
                              color: col,
                              border: `1px solid ${col}50`,
                              padding: '4px 8px',
                              zIndex: 4,
                            }}>
                            <span className="block truncate text-xs font-bold">{e.title}</span>
                            <span className="block text-[10px] opacity-75">{t}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* AddModal */}
      {showAddModal && (
        <AddModal
          defaultDate={selectedDate}
          onClose={() => setShowAddModal(false)}
          onAdd={(entry) => { addEntry(entry); setShowAddModal(false) }}
        />
      )}

      {/* EditModal */}
      {editEntry && (
        <EditModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSave={(updates) => { updateEntry(editEntry.id, updates); setEditEntry(null) }}
          onRemove={() => { removeEntry(editEntry.id); setEditEntry(null) }}
        />
      )}
    </div>
  )
}

// ── ImageViewer ───────────────────────────────────────────────
function ImageViewer({ src, onClose }: { src: string; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt=""
        className="max-w-full max-h-full object-contain"
        style={{ maxHeight: '90vh', maxWidth: '100vw' }}
        onClick={(e) => e.stopPropagation()} />
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.15)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>,
    document.body
  )
}

// ── EntryCard ─────────────────────────────────────────────────
function EntryCard({ entry, onEdit, onRemove }: {
  entry: MyEntry
  onEdit: () => void
  onRemove: () => void
}) {
  const [viewerSrc, setViewerSrc] = useState<string | null>(null)
  const t = useTranslations()
  const tag = (entry.tags?.[0] || entry.type) as ScheduleTag
  const tagCfg = scheduleTagConfig[tag]
  const cfg = tagCfg || eventTypeConfig[entry.type as keyof typeof eventTypeConfig]
  const color = tagCfg?.color ?? cfg?.color ?? entry.color
  const label = tagCfg ? `${tagCfg.icon} ${tagCfg.label}` : cfg?.label ?? entry.type
  // 来場日が登録済みなら期間ではなくその日として扱う
  const isPeriod = !!entry.dateEnd && !entry.customDate
  const dateStr = entry.customDate
    ? fmtDateRange(entry.customDate, entry.customTime ?? entry.time)
    : fmtDateRange(entry.date, entry.time, entry.dateEnd)
  const mainImage = entry.images?.[0] ?? entry.ticketImages?.[0] ?? null

  return (
    <>
      <button onClick={onEdit} className="rounded-2xl overflow-hidden flex text-left w-full"
        style={{ background: '#FFFFFF', minHeight: 104 }}>

        {/* 左：画像 */}
        <div className="flex-shrink-0 relative overflow-hidden" style={{ width: 88 }}>
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage} alt={entry.title}
              className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E8D5F5 0%, #D5E5F5 50%, #F5D5E8 100%)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="w-10 h-10 opacity-40" />
            </div>
          )}
          <div className="absolute inset-y-0 right-0 w-0.5" style={{ background: color }} />
        </div>

        {/* 右：情報 */}
        <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center gap-1">
          <div className="flex items-center gap-1">
            <span className="text-sm flex-shrink-0">{tagCfg?.icon ?? '📌'}</span>
            <p className="text-[10px] leading-snug truncate" style={{ color: '#8E8E93' }}>
              {entry.title}
            </p>
            {isPeriod && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: 'rgba(0,0,0,0.06)', color: '#8E8E93' }}>{t('Common.period')}</span>
            )}
          </div>
          {entry.subTitle && (
            <p className="text-sm font-semibold leading-snug" style={{ color: '#1C1C1E' }}>
              {entry.subTitle}
            </p>
          )}
          <p className="text-xs font-semibold" style={{ color }}>{dateStr}</p>
          {(entry.venue || entry.city) && (
            <div className="flex items-center gap-1">
              {entry.city && (
                <span style={{ fontSize: 12, lineHeight: 1 }}>
                  {countryFlag(entry.city)}
                </span>
              )}
              <span className="text-[11px] truncate" style={{ color: '#8E8E93' }}>
                {entry.venue}{entry.venue && entry.city ? ' · ' : ''}{entry.city}
              </span>
            </div>
          )}
          {entry.sourceUrl && (
            <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] font-bold truncate"
              style={{ color: '#60A5FA' }}>
              {t('MyPage.sourceLink')}
            </a>
          )}
          {entry.memo && (
            <p className="text-[11px] leading-snug line-clamp-1"
              style={{ color: '#636366' }}>
              📝 {entry.memo}
            </p>
          )}
        </div>
      </button>

      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
    </>
  )
}

// ── AddModal（プライベートスケジュール追加） ──────────────────────
function AddModal({ defaultDate, onClose, onAdd }: {
  defaultDate: string
  onClose: () => void
  onAdd: (entry: MyEntry) => void
}) {
  const t = useTranslations()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [dateEnd, setDateEnd] = useState('')
  const [time, setTime] = useState('')
  const [venue, setVenue] = useState('')
  const [memo, setMemo] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('')

  const [portalMounted, setPortalMounted] = useState(false)
  useEffect(() => { setPortalMounted(true) }, [])

  const handleAdd = () => {
    if (!title.trim()) return
    onAdd({
      id: Date.now().toString(),
      date,
      dateEnd: dateEnd || undefined,
      title: title.trim(),
      type: selectedTag || 'memo',
      tags: selectedTag ? [selectedTag] : [],
      color: selectedTag && scheduleTagConfig[selectedTag as ScheduleTag]
        ? scheduleTagConfig[selectedTag as ScheduleTag].color
        : '#8E8E93',
      venue: venue || undefined,
      time: time || undefined,
      memo,
      images: [],
      ticketImages: [],
      createdAt: new Date().toISOString(),
    })
  }

  if (!portalMounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div className="relative flex flex-col rounded-t-2xl overflow-hidden"
        style={{ background: '#F8F9FA', maxHeight: '85vh' }}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style={{ borderBottom: '1px solid #E5E5EA' }}>
          <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{t('Schedule.addPrivateSchedule')}</p>
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} disabled={!title.trim()}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: title.trim() ? '#F3B4E3' : '#E5E5EA', color: title.trim() ? '#FFFFFF' : '#8E8E93' }}>
              {t('Common.add')}
            </button>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* タイトル */}
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={t('Schedule.titlePlaceholder')}
            className="w-full px-3 py-3 rounded-xl text-base font-bold outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
            autoFocus />

          {/* タグ選択 */}
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setSelectedTag('')}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold"
              style={!selectedTag
                ? { background: '#8E8E93', color: '#FFFFFF' }
                : { background: '#F0F0F5', color: '#636366' }
              }>📌 {t('Schedule.private')}</button>
            {(Object.entries(scheduleTagConfig) as [ScheduleTag, typeof scheduleTagConfig[ScheduleTag]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setSelectedTag(key)}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                style={selectedTag === key
                  ? { background: cfg.color, color: '#FFFFFF' }
                  : { background: cfg.bg, color: cfg.color }
                }>{cfg.icon} {cfg.label}</button>
            ))}
          </div>

          {/* 日付 */}
          <div className="flex gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-28 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#8E8E93' }}>〜</span>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
          </div>

          {/* 会場 */}
          <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)}
            placeholder={t('Schedule.venuePlaceholder')}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />

          {/* メモ */}
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)}
            placeholder={t('My.memoPlaceholder')}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
        </div>

        <div style={{ height: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} />
      </div>
    </div>,
    document.body
  )
}

// ── EditModal ─────────────────────────────────────────────────
function EditModal({ entry, onClose, onSave, onRemove }: {
  entry: MyEntry
  onClose: () => void
  onSave: (updates: Partial<MyEntry>) => void
  onRemove: () => void
}) {
  const [customDate, setCustomDate] = useState(entry.customDate ?? '')
  const [customTime, setCustomTime] = useState(entry.customTime ?? '')
  const [reservationNote, setReservationNote] = useState(entry.reservationNote ?? '')
  const [ticketImages, setTicketImages] = useState<string[]>(entry.ticketImages ?? [])
  const [seatInfo, setSeatInfo] = useState<SeatInfo>(entry.seatInfo ?? { fields: [] })
  const [memo, setMemo] = useState(entry.memo ?? '')
  const [images, setImages] = useState<string[]>(entry.images ?? [])
  const [autoAnalyzeTrigger, setAutoAnalyzeTrigger] = useState(0)
  const [showConfirmRemove, setShowConfirmRemove] = useState(false)
  const [viewImages, setViewImages] = useState<string[]>(entry.viewImages ?? [])
  const ticketFileRef = useRef<HTMLInputElement>(null)
  const viewFileRef = useRef<HTMLInputElement>(null)
  const photoFileRef = useRef<HTMLInputElement>(null)
  const t = useTranslations()

  const [portalMounted2, setPortalMounted2] = useState(false)
  useEffect(() => { setPortalMounted2(true) }, [])

  const isPeriod = !!entry.dateEnd
  const editTag = (entry.tags?.[0] || entry.type) as ScheduleTag
  const editTagCfg = scheduleTagConfig[editTag]
  const cfg = editTagCfg || eventTypeConfig[entry.type as keyof typeof eventTypeConfig]
  const color = editTagCfg?.color ?? cfg?.color ?? entry.color
  const dateStr = fmtDateRange(entry.date, entry.time, entry.dateEnd)
  // チケット画像・座席情報を表示するタグ（場所があるイベント）
  const TICKET_TAGS = ['CONCERT', 'EVENT', 'POPUP', 'LIVEVIEWING']
  const showTicketSection = entry.venue || !entry.tags?.length || entry.tags.some((t) => TICKET_TAGS.includes(t))

  const handleTicketUpload = async (files: FileList | null) => {
    if (!files) return
    const { uploadImage } = await import('@/lib/supabase/uploadImage')
    const results: string[] = []
    for (const f of Array.from(files)) {
      const url = await uploadImage('event-images', f, 800, 0.72)
      if (url) results.push(url)
    }
    const next = [...ticketImages, ...results]
    setTicketImages(next)
    setAutoAnalyzeTrigger((v) => v + 1)
  }

  const handleViewUpload = async (files: FileList | null) => {
    if (!files) return
    const { uploadImage } = await import('@/lib/supabase/uploadImage')
    const results: string[] = []
    for (const f of Array.from(files)) {
      const url = await uploadImage('event-images', f, 1200, 0.8)
      if (url) results.push(url)
    }
    setViewImages((prev) => [...prev, ...results])
  }

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files) return
    const { uploadImage } = await import('@/lib/supabase/uploadImage')
    const results: string[] = []
    for (const f of Array.from(files)) {
      const url = await uploadImage('event-images', f, 1200, 0.85)
      if (url) results.push(url)
    }
    setImages((prev) => [...prev, ...results])
  }

  const handleSave = () => {
    onSave({
      customDate: customDate || undefined,
      customTime: customTime || undefined,
      reservationNote: reservationNote || undefined,
      ticketImages,
      seatInfo,
      memo,
      images,
      viewImages,
    })
  }

  if (!portalMounted2) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div className="relative flex flex-col rounded-t-2xl overflow-hidden"
        style={{ background: '#F8F9FA', maxHeight: '92vh' }}>
        {/* ドラッグハンドル */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>

        {/* ヘッダー */}
        <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
          style={{ borderBottom: '1px solid #E5E5EA' }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: color, color: '#F8F9FA' }}>
                {editTagCfg ? `${editTagCfg.icon} ${editTagCfg.label}` : cfg?.label ?? entry.type}
              </span>
            </div>
            <p className="text-sm font-bold truncate" style={{ color: '#1C1C1E' }}>{entry.title}</p>
            <p className="text-xs" style={{ color }}>{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleSave}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#F3B4E3', color: '#FFFFFF' }}>
              {t('Common.save')}
            </button>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* スクロール可能なコンテンツ */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

          {/* 来場日（期間イベントのみ） */}
          {isPeriod && (
            <EditSection label={t('My.visitDate')}>
              <input type="date" value={customDate}
                min={entry.date} max={entry.dateEnd}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
            </EditSection>
          )}

          {/* 時間 */}
          <EditSection label={t('My.time')}>
            <input type="time" value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
          </EditSection>

          {/* 予約番号 */}
          <EditSection label={t('My.reservationNumber')}>
            <input type="text" value={reservationNote}
              onChange={(e) => setReservationNote(e.target.value)}
              placeholder={t('My.reservationPlaceholder')}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
          </EditSection>

          {/* チケット画像（LIVE/TICKET/EVENT/POPUPのみ） */}
          {showTicketSection && (
            <EditSection label={t('My.ticketImage')}>
              <div className="flex flex-col gap-2">
                {ticketImages.map((img, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden w-full"
                    style={{ aspectRatio: '16/9', background: '#E5E5EA' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-contain" />
                    <button onClick={() => setTicketImages((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.65)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button onClick={() => ticketFileRef.current?.click()}
                  className="w-full rounded-xl flex flex-col items-center justify-center gap-2"
                  style={{ aspectRatio: '16/9', border: '2px dashed #E5E5EA', color: '#8E8E93' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-[11px]">{t('Common.add')}</span>
                </button>
              </div>
              <input ref={ticketFileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => handleTicketUpload(e.target.files)} />
            </EditSection>
          )}

          {/* 視野画像（LIVE/EVENTのみ） */}
          {showTicketSection && (
            <EditSection label={t('MyPage.seatView')}>
              <div className="flex flex-wrap gap-2">
                {viewImages.map((img: string, i: number) => (
                  <div key={i} className="relative rounded-xl overflow-hidden"
                    style={{ width: 100, aspectRatio: '16/9' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setViewImages((p: string[]) => p.filter((_: string, j: number) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.65)' }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button onClick={() => viewFileRef.current?.click()}
                  className="rounded-xl flex flex-col items-center justify-center gap-1"
                  style={{ width: 100, aspectRatio: '16/9', border: '2px dashed #E5E5EA', color: '#8E8E93' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span className="text-[10px]">{t('Common.add')}</span>
                </button>
              </div>
              <input ref={viewFileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => handleViewUpload(e.target.files)} />
              <p className="text-[10px] mt-2" style={{ color: '#F59E0B' }}>
                {t('MyPage.viewImagePublic')}
              </p>
            </EditSection>
          )}

          {/* 他のCARATの座席ビュー */}
          {showTicketSection && (
            <EditSection label={t('MyPage.seatViewOthers') || '他のCARATの座席ビュー'}>
              <SeatViewPreview
                seatInfo={seatInfo}
                venue={entry.venue}
                eventName={entry.title}
                eventDate={entry.date}
              />
            </EditSection>
          )}

          {/* メモ */}
          <EditSection label={t('My.memo')}>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)}
              placeholder={t('My.memoPlaceholder')}
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
          </EditSection>

          {/* 思い出写真 */}
          <EditSection label={t('My.memoryPhotos')}>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden"
                  style={{ width: 80, aspectRatio: '4/5' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover object-top" />
                  <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.65)' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
              <button onClick={() => photoFileRef.current?.click()}
                className="rounded-xl flex flex-col items-center justify-center gap-1"
                style={{ width: 80, aspectRatio: '4/5', border: '2px dashed #E5E5EA', color: '#8E8E93' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[10px]">{t('Common.add')}</span>
              </button>
            </div>
            <input ref={photoFileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => handlePhotoUpload(e.target.files)} />
          </EditSection>

          {/* 削除 */}
          {showConfirmRemove ? (
            <div className="flex gap-2">
              <button onClick={onRemove}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ background: '#FEE2E2', color: '#EF4444' }}>{t('My.confirmDelete')}</button>
              <button onClick={() => setShowConfirmRemove(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#F0F0F5', color: '#636366' }}>{t('Common.cancel')}</button>
            </div>
          ) : (
            <button onClick={() => setShowConfirmRemove(true)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#F0F0F5', color: '#EF4444' }}>{t('Common.delete')}</button>
          )}
        </div>

        {/* 下部余白（タブバーに被らないように） */}
        <div style={{ height: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} />
      </div>
    </div>,
    document.body
  )
}

// ── EditSection ───────────────────────────────────────────────
function EditSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold mb-2" style={{ color: '#636366' }}>{label}</p>
      {children}
    </div>
  )
}
