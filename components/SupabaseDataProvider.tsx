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

    const ranges = [
      { y: prevY, m: prevM },
      { y, m },
      { y: nextY, m: nextM },
    ]

    const all: SupabaseEvent[] = []
    const seen = new Set<string>()

    for (const { y: yr, m: mo } of ranges) {
      const start = `${yr}-${String(mo).padStart(2, '0')}-01T00:00:00`
      const nextMonth = mo === 12 ? 1 : mo + 1
      const nextYear = mo === 12 ? yr + 1 : yr
      const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`

      const [{ data: d1 }, { data: d2 }] = await Promise.all([
        supabase.from('events')
          .select('*, submitter:profiles!submitted_by(nickname)')
          .gte('start_date', start).lt('start_date', end)
          .order('start_date'),
        supabase.from('events')
          .select('*, submitter:profiles!submitted_by(nickname)')
          .gte('end_date', start).lt('start_date', start)
          .order('start_date'),
      ])

      for (const e of [...(d1 || []), ...(d2 || [])]) {
        if (!seen.has(e.id)) {
          seen.add(e.id)
          all.push(e as SupabaseEvent)
        }
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
