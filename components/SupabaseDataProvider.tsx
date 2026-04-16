'use client'

import { useEffect, useState, useCallback, createContext, useContext } from 'react'
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
}

const DataContext = createContext<DataContextType>({ events: [], spots: [], loading: true, refreshSpots: async () => {}, refreshEvents: async () => {} })

export function useSupabaseData() {
  return useContext(DataContext)
}

function getMonthRange(y: number, m: number) {
  const start = `${y}-${String(m).padStart(2, '0')}-01T00:00:00`
  const nm = m === 12 ? 1 : m + 1
  const ny = m === 12 ? y + 1 : y
  return { start, end: `${ny}-${String(nm).padStart(2, '0')}-01T00:00:00` }
}

export default function SupabaseDataProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [spots, setSpots] = useState<AppSpot[]>([])
  const [loading, setLoading] = useState(true)

  const refreshEvents = useCallback(async () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    const prevM = m === 1 ? 12 : m - 1
    const prevY = m === 1 ? y - 1 : y
    const nextM = m === 12 ? 1 : m + 1
    const nextY = m === 12 ? y + 1 : y

    // 3ヶ月分の開始〜終了を1つのレンジにまとめて1回のクエリで取得
    const { start } = getMonthRange(prevY, prevM)
    const { end } = getMonthRange(nextY, nextM)

    const [{ data: d1 }, { data: d2 }] = await Promise.all([
      // start_date がレンジ内
      supabase.from('events')
        .select('*, submitter:profiles!submitted_by(nickname)')
        .gte('start_date', start).lt('start_date', end)
        .order('start_date'),
      // 期間イベント: start_date < 先月1日 だが end_date >= 先月1日
      supabase.from('events')
        .select('*, submitter:profiles!submitted_by(nickname)')
        .lt('start_date', start).gte('end_date', start)
        .order('start_date'),
    ])

    const seen = new Set<string>()
    const all: SupabaseEvent[] = []
    for (const e of [...(d1 || []), ...(d2 || [])]) {
      if (!seen.has(e.id)) {
        seen.add(e.id)
        all.push(e as SupabaseEvent)
      }
    }
    setEvents(all.map(toAppEvent))
  }, [])

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
    Promise.all([
      refreshEvents(),
      refreshSpots(),
    ]).then(() => setLoading(false))
  }, [refreshEvents, refreshSpots])

  return (
    <DataContext.Provider value={{ events, spots, loading, refreshSpots, refreshEvents }}>
      {children}
    </DataContext.Provider>
  )
}
