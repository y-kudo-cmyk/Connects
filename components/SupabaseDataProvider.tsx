'use client'

import { useEffect, useState, useCallback, createContext, useContext, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toAppEvent, toAppSpot, type AppEvent, type AppSpot } from '@/lib/supabase/adapters'
import type { SupabaseEvent } from '@/lib/supabase/useEvents'
import type { SupabaseSpotPhoto } from '@/lib/supabase/useSpots'

const supabase = createClient()

type DataContextType = {
  events: AppEvent[]
  spots: AppSpot[]
  loading: boolean
  refreshSpots: () => Promise<void>
  refreshEvents: () => Promise<void>
  /** スケジュールページ等で月を変えたとき、その月のデータを追加取得 */
  ensureMonth: (year: number, month: number) => Promise<void>
}

const DataContext = createContext<DataContextType>({
  events: [], spots: [], loading: true,
  refreshSpots: async () => {}, refreshEvents: async () => {},
  ensureMonth: async () => {},
})

export function useSupabaseData() {
  return useContext(DataContext)
}

// 月初・月末のISO文字列
function monthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`
  return { start, end }
}

async function fetchEventsInRange(from: string, to: string): Promise<SupabaseEvent[]> {
  // start_date がレンジ内 OR end_date がレンジ内（期間イベント対応）
  const [{ data: d1 }, { data: d2 }] = await Promise.all([
    supabase.from('events')
      .select('*, submitter:profiles!submitted_by(nickname)')
      .gte('start_date', from)
      .lt('start_date', to)
      .order('start_date'),
    supabase.from('events')
      .select('*, submitter:profiles!submitted_by(nickname)')
      .gte('end_date', from)
      .lt('start_date', from) // start_date は範囲より前だが end_date が範囲内
      .order('start_date'),
  ])
  // 重複排除
  const seen = new Set<string>()
  return [...(d1 || []), ...(d2 || [])].filter(e => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  }) as SupabaseEvent[]
}

export default function SupabaseDataProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [spots, setSpots] = useState<AppSpot[]>([])
  const [loading, setLoading] = useState(true)
  // どの月を取得済みかトラック
  const loadedMonths = useRef<Set<string>>(new Set())
  const eventMapRef = useRef<Map<string, AppEvent>>(new Map())

  const mergeEvents = useCallback((newRaw: SupabaseEvent[]) => {
    const map = eventMapRef.current
    for (const e of newRaw) {
      map.set(e.id, toAppEvent(e))
    }
    setEvents(Array.from(map.values()))
  }, [])

  const ensureMonth = useCallback(async (year: number, month: number) => {
    const key = `${year}-${month}`
    if (loadedMonths.current.has(key)) return
    loadedMonths.current.add(key)
    const { start, end } = monthRange(year, month)
    const raw = await fetchEventsInRange(start, end)
    mergeEvents(raw)
  }, [mergeEvents])

  const refreshEvents = useCallback(async () => {
    // 現在ロード済みの全月を再取得
    const promises = Array.from(loadedMonths.current).map(key => {
      const [y, m] = key.split('-').map(Number)
      const { start, end } = monthRange(y, m)
      return fetchEventsInRange(start, end)
    })
    const results = await Promise.all(promises)
    // リセットして再マージ
    eventMapRef.current.clear()
    for (const raw of results) mergeEvents(raw)
  }, [mergeEvents])

  const refreshSpots = useCallback(async () => {
    const [spotsRes, photosRes] = await Promise.all([
      supabase.from('spots').select('*, submitter:profiles!submitted_by(nickname)').order('spot_name'),
      supabase.from('spot_photos').select('*'),
    ])
    if (spotsRes.data && photosRes.data) {
      const photos = photosRes.data as SupabaseSpotPhoto[]
      setSpots(spotsRes.data.map(s => toAppSpot(s, photos.filter(p => p.spot_id === s.id))))
    }
  }, [])

  useEffect(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    // 先月・今月・来月の3ヶ月を初期取得
    const prevM = m === 1 ? 12 : m - 1
    const prevY = m === 1 ? y - 1 : y
    const nextM = m === 12 ? 1 : m + 1
    const nextY = m === 12 ? y + 1 : y

    const months = [
      { y: prevY, m: prevM },
      { y, m },
      { y: nextY, m: nextM },
    ]

    for (const { y: yr, m: mo } of months) {
      loadedMonths.current.add(`${yr}-${mo}`)
    }

    const eventPromises = months.map(({ y: yr, m: mo }) => {
      const { start, end } = monthRange(yr, mo)
      return fetchEventsInRange(start, end)
    })

    Promise.all([
      ...eventPromises,
      supabase.from('spots').select('*, submitter:profiles!submitted_by(nickname)').order('spot_name'),
      supabase.from('spot_photos').select('*'),
    ]).then((results) => {
      // 最後の2つはspots, photos
      const spotsRes = results[results.length - 2] as { data: unknown[] | null }
      const photosRes = results[results.length - 1] as { data: SupabaseSpotPhoto[] | null }

      // イベントマージ
      for (let i = 0; i < eventPromises.length; i++) {
        mergeEvents(results[i] as SupabaseEvent[])
      }

      if (spotsRes.data && photosRes.data) {
        const photos = photosRes.data as SupabaseSpotPhoto[]
        setSpots((spotsRes.data as Array<{ id: string; [key: string]: unknown }>).map(
          s => toAppSpot(s as Parameters<typeof toAppSpot>[0], photos.filter(p => p.spot_id === s.id))
        ))
      }
      setLoading(false)
    })
  }, [mergeEvents])

  return (
    <DataContext.Provider value={{ events, spots, loading, refreshSpots, refreshEvents, ensureMonth }}>
      {children}
    </DataContext.Provider>
  )
}
