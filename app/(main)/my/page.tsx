'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useMyEntries, MyEntry, compressImage, SeatInfo } from '@/lib/useMyEntries'
import { eventTypeConfig } from '@/lib/mockData'
import SeatInfoForm from '@/components/SeatInfoForm'
import SeatViewPreview from '@/components/SeatViewPreview'
import TodoSection from '@/components/TodoSection'

const TODAY = new Date().toISOString().slice(0, 10)

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
const DAY_SHORT = ['日','月','火','水','木','金','土']

// ── メインページ ─────────────────────────────────────────────────
export default function MyPage() {
  const now = new Date()
  const [tab, setTab] = useState<'entries' | 'todos'>('entries')
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [weekAnchor, setWeekAnchor] = useState(TODAY)
  const [editEntry, setEditEntry] = useState<MyEntry | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const { entries, updateEntry, removeEntry } = useMyEntries()

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

  // ── 月ビュー用 ──────────────────────────────────────────────────
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }
  const daysCount = getDaysInMonth(year, month)
  const firstDay = getFirstDay(year, month)
  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  // エントリが持つ日付セット（期間エントリは全日をカバー）
  const entryDates = new Set<string>()
  for (const e of entries) {
    if (!e.dateEnd) {
      entryDates.add(e.customDate ?? e.date)
    } else {
      const cur = new Date(e.date)
      const end = new Date(e.dateEnd)
      while (cur <= end) {
        entryDates.add(cur.toISOString().slice(0, 10))
        cur.setDate(cur.getDate() + 1)
      }
    }
  }

  // 選択日のエントリ
  const dayEntries = entries.filter((e) => {
    if (e.dateEnd) return e.date <= selectedDate && selectedDate <= e.dateEnd
    return (e.customDate ?? e.date) === selectedDate
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Header */}
      <div className="px-4"
        style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', paddingBottom: 8, background: '#F8F9FA' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black tracking-wider" style={{ color: '#1C1C1E' }}>MY</h1>
          {tab === 'entries' && (
            <div className="flex rounded-lg p-0.5" style={{ background: '#EFEFEF' }}>
              {(['month', 'week', 'day'] as const).map((v) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className="px-3 py-1.5 rounded-md text-[11px] font-bold"
                  style={viewMode === v
                    ? { background: '#F3B4E3', color: '#FFFFFF' }
                    : { color: '#8E8E93' }
                  }>
                  {v === 'month' ? '月' : v === 'week' ? '週' : '日'}
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
            スケジュール記録
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
                  const hasDot = entryDates.has(ds)
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
                      {hasDot && (
                        <span className="w-1 h-1 rounded-full mt-0.5"
                          style={{ background: isSelected ? '#F8F9FA' : '#F3B4E3' }} />
                      )}
                    </button>
                  )
                })}
              </div>
              {/* 選択日のエントリ */}
              <div className="pb-28">
                <p className="text-xs font-semibold mb-3" style={{ color: '#8E8E93' }}>
                  {md(selectedDate)} · {dayEntries.length}件
                </p>
                {dayEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10" style={{ color: '#8E8E93' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mb-2 opacity-40">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p className="text-sm">この日の記録はありません</p>
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
            const allDayEntries = entries.filter((e) => !e.time || e.time === '00:00')
            const timedEntries = entries.filter((e) => e.time && e.time !== '00:00')
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
                      <span className="text-[9px]" style={{ color: '#8E8E93' }}>終日</span>
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
            const timedE = entries.filter((e) => {
              const t = e.customTime ?? e.time
              if (!t || t === '00:00') return false
              if (e.dateEnd) return e.date <= selectedDate && selectedDate <= e.dateEnd
              return (e.customDate ?? e.date) === selectedDate
            })
            const allDayE = entries.filter((e) => {
              const t = e.customTime ?? e.time
              if (t && t !== '00:00') return false
              if (e.dateEnd) return e.date <= selectedDate && selectedDate <= e.dateEnd
              return (e.customDate ?? e.date) === selectedDate
            })
            const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

            return (
              <div className="flex flex-col" style={{ height: 'calc(100vh - 148px)' }}>
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
                    <span className="text-[10px] self-center" style={{ color: '#8E8E93' }}>終日</span>
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
  return (
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
    </div>
  )
}

// ── EntryCard ─────────────────────────────────────────────────
function EntryCard({ entry, onEdit, onRemove }: {
  entry: MyEntry
  onEdit: () => void
  onRemove: () => void
}) {
  const [viewerSrc, setViewerSrc] = useState<string | null>(null)
  const cfg = eventTypeConfig[entry.type as keyof typeof eventTypeConfig]
  const color = cfg?.color ?? entry.color
  const label = cfg?.label ?? entry.type
  // 来場日が登録済みなら期間ではなくその日として扱う
  const isPeriod = !!entry.dateEnd && !entry.customDate
  const dateStr = entry.customDate
    ? fmtDateRange(entry.customDate, entry.customTime ?? entry.time)
    : fmtDateRange(entry.date, entry.time, entry.dateEnd)
  const mainImage = entry.images?.[0] ?? entry.ticketImages?.[0] ?? null

  return (
    <>
      <div className="rounded-2xl overflow-hidden flex"
        style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', minHeight: 104 }}>

        {/* 左：画像 */}
        <button
          className="flex-shrink-0 relative overflow-hidden"
          style={{ width: 88 }}
          onClick={() => mainImage && setViewerSrc(mainImage)}
          disabled={!mainImage}
        >
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage} alt={entry.title}
              className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(160deg, ${color}35 0%, ${color}12 100%)` }}>
              <span className="text-lg font-black opacity-25" style={{ color }}>
                {entry.title.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          {/* タイプカラーライン */}
          <div className="absolute inset-y-0 right-0 w-0.5" style={{ background: color }} />
        </button>

        {/* 右：情報 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: cfg?.bg ?? color + '20', color }}>{label}</span>
                {isPeriod && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(0,0,0,0.06)', color: '#8E8E93' }}>期間</span>
                )}
              </div>
              <p className="text-sm font-bold leading-snug" style={{ color: '#1C1C1E' }}>
                {entry.title}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color }}>{dateStr}</p>
              {entry.venue && (
                <p className="text-[11px] mt-0.5 truncate" style={{ color: '#8E8E93' }}>{entry.venue}</p>
              )}
              {entry.seatInfo?.fields?.some((f) => f.value.trim()) && (
                <p className="text-[11px] mt-0.5 font-semibold" style={{ color: '#3B82F6' }}>
                  🪑 {entry.seatInfo.fields.filter((f) => f.value.trim()).map((f) => f.value).join(' / ')}
                </p>
              )}
            </div>
            <button onClick={onEdit}
              className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ background: '#F0F0F5' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          {entry.memo ? (
            <p className="text-[11px] mt-1.5 leading-snug line-clamp-2"
              style={{ color: '#636366', whiteSpace: 'pre-wrap' }}>
              {entry.memo}
            </p>
          ) : null}
        </div>
      </div>

      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
    </>
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
  const ticketFileRef = useRef<HTMLInputElement>(null)
  const photoFileRef = useRef<HTMLInputElement>(null)

  const isPeriod = !!entry.dateEnd
  const cfg = eventTypeConfig[entry.type as keyof typeof eventTypeConfig]
  const color = cfg?.color ?? entry.color
  const dateStr = fmtDateRange(entry.date, entry.time, entry.dateEnd)

  const handleTicketUpload = async (files: FileList | null) => {
    if (!files) return
    const results: string[] = []
    for (const f of Array.from(files)) results.push(await compressImage(f))
    const next = [...ticketImages, ...results]
    setTicketImages(next)
    setAutoAnalyzeTrigger((v) => v + 1)
  }

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files) return
    const results: string[] = []
    for (const f of Array.from(files)) results.push(await compressImage(f))
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
    })
  }

  return (
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
                {cfg?.label ?? entry.type}
              </span>
            </div>
            <p className="text-sm font-bold truncate" style={{ color: '#1C1C1E' }}>{entry.title}</p>
            <p className="text-xs" style={{ color }}>{dateStr}</p>
          </div>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* スクロール可能なコンテンツ */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

          {/* 来場日（期間イベントのみ） */}
          {isPeriod && (
            <EditSection label="来場日">
              <input type="date" value={customDate}
                min={entry.date} max={entry.dateEnd}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
            </EditSection>
          )}

          {/* 時間 */}
          <EditSection label="時間">
            <input type="time" value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
          </EditSection>

          {/* 予約番号 */}
          <EditSection label="予約番号・確認番号">
            <input type="text" value={reservationNote}
              onChange={(e) => setReservationNote(e.target.value)}
              placeholder="例: ABC-12345"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
          </EditSection>

          {/* チケット画像 */}
          <EditSection label="チケット画像">
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {ticketImages.map((img, i) => (
                <div key={i} className="flex-shrink-0 relative rounded-xl overflow-hidden"
                  style={{ width: 64, height: 88 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setTicketImages((p) => p.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.65)' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
              <button onClick={() => ticketFileRef.current?.click()}
                className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center gap-1"
                style={{ width: 64, height: 88, border: '2px dashed #E5E5EA', color: '#8E8E93' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[10px]">追加</span>
              </button>
            </div>
            <input ref={ticketFileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => handleTicketUpload(e.target.files)} />
          </EditSection>

          {/* 座席情報 */}
          <div className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
            <SeatInfoForm value={seatInfo} onChange={setSeatInfo}
              ticketImages={ticketImages} autoAnalyzeTrigger={autoAnalyzeTrigger} />
          </div>

          {/* 座席眺め */}
          {seatInfo.fields?.some((f) => f.value.trim()) && (
            <div className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
              <SeatViewPreview seatInfo={seatInfo} venue={entry.venue}
                eventName={entry.title} eventDate={entry.customDate ?? entry.date} />
            </div>
          )}

          {/* メモ */}
          <EditSection label="メモ">
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)}
              placeholder="参戦メモを書こう..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
          </EditSection>

          {/* 思い出写真 */}
          <EditSection label="思い出写真">
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
                <span className="text-[10px]">追加</span>
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
                style={{ background: '#FEE2E2', color: '#EF4444' }}>削除する</button>
              <button onClick={() => setShowConfirmRemove(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#F0F0F5', color: '#636366' }}>キャンセル</button>
            </div>
          ) : (
            <button onClick={() => setShowConfirmRemove(true)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#F0F0F5', color: '#EF4444' }}>この記録を削除</button>
          )}
        </div>

        {/* 保存ボタン */}
        <div className="px-4 pt-3 flex-shrink-0"
          style={{ borderTop: '1px solid #E5E5EA', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
          <button onClick={handleSave}
            className="w-full py-4 rounded-xl text-base font-bold min-h-[52px]"
            style={{ background: '#F3B4E3', color: '#FFFFFF' }}>
            保存
          </button>
        </div>
      </div>
    </div>
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
