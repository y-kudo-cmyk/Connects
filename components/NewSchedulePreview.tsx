'use client'

import { useState, useEffect } from 'react'
import { events, eventTypeConfig, tagConfig, Event } from '@/lib/mockData'
import { useMyEntries } from '@/lib/useMyEntries'

const TODAY = '2026-04-02'
const DISMISSED_KEY = 'cp-dismissed'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function NewSchedulePreview() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const { addEntry, hasEntry } = useMyEntries()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY)
      if (raw) setDismissed(new Set(JSON.parse(raw)))
    } catch {}
  }, [])

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const importAndDismiss = (event: Event) => {
    if (!hasEntry(event.id)) {
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
    dismiss(event.id)
  }

  const upcoming = events
    .filter((e) => e.date >= TODAY && !dismissed.has(e.id))
    .slice(0, 8)

  if (upcoming.length === 0) return null

  return (
    <section className="pb-2">
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F3B4E3' }} />
          <h2 className="text-xs font-bold tracking-wider" style={{ color: '#636366' }}>新着スケジュール</h2>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}
        >
          {upcoming.length}件
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {upcoming.map((event) => {
          const cfg = eventTypeConfig[event.type]
          const d = new Date(event.date)
          const imported = hasEntry(event.id)
          const primaryTag = event.tags?.[0]
          const tagCfg = primaryTag ? tagConfig[primaryTag] : null

          return (
            <div
              key={event.id}
              className="flex-shrink-0 rounded-xl p-3 flex flex-col gap-2"
              style={{
                background: '#FFFFFF',
                borderTop: `2px solid ${cfg.color}`,
                width: 180,
              }}
            >
              {/* Date chip */}
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {MONTH_SHORT[d.getMonth()]} {d.getDate()}
                </span>
                {tagCfg && (
                  <span className="text-[10px]">{tagCfg.icon}</span>
                )}
              </div>

              {/* Title */}
              <p className="text-xs font-semibold leading-tight flex-1" style={{ color: '#1C1C1E' }}>
                {event.title}
              </p>

              {event.venue && (
                <p className="text-[10px]" style={{ color: '#8E8E93' }}>📍 {event.venue}</p>
              )}

              {/* Actions */}
              <div className="flex gap-1.5 mt-auto">
                <button
                  onClick={() => dismiss(event.id)}
                  className="flex-1 py-3 rounded-lg text-xs font-bold min-h-[44px]"
                  style={{ background: '#F0F0F5', color: '#636366' }}
                >
                  確認
                </button>
                <button
                  onClick={() => importAndDismiss(event)}
                  className="flex-1 py-3 rounded-lg text-xs font-bold min-h-[44px]"
                  style={imported
                    ? { background: 'rgba(243,180,227,0.15)', color: '#F3B4E3' }
                    : { background: '#F3B4E3', color: '#F8F9FA' }
                  }
                >
                  {imported ? '✓ MY' : '+ MY'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
