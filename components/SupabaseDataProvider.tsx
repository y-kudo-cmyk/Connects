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
}

const DataContext = createContext<DataContextType>({ events: [], spots: [], loading: true, refreshSpots: async () => {} })

export function useSupabaseData() {
  return useContext(DataContext)
}

export default function SupabaseDataProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [spots, setSpots] = useState<AppSpot[]>([])
  const [loading, setLoading] = useState(true)

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
    async function fetchAllEvents(): Promise<SupabaseEvent[]> {
      const all: SupabaseEvent[] = []
      let from = 0
      const pageSize = 1000
      while (true) {
        const { data } = await supabase
          .from('events')
          .select('*, submitter:profiles!submitted_by(nickname)')
          .order('start_date', { ascending: true })
          .range(from, from + pageSize - 1)
        if (!data || data.length === 0) break
        all.push(...(data as SupabaseEvent[]))
        if (data.length < pageSize) break
        from += pageSize
      }
      return all
    }

    Promise.all([
      fetchAllEvents(),
      supabase.from('spots').select('*, submitter:profiles!submitted_by(nickname)').order('spot_name'),
      supabase.from('spot_photos').select('*'),
    ]).then(([allEvents, spotsRes, photosRes]) => {
      setEvents(allEvents.map(toAppEvent))
      if (spotsRes.data && photosRes.data) {
        const photos = photosRes.data as SupabaseSpotPhoto[]
        setSpots(spotsRes.data.map(s => toAppSpot(s, photos.filter(p => p.spot_id === s.id))))
      }
      setLoading(false)
    })
  }, [])

  return (
    <DataContext.Provider value={{ events, spots, loading, refreshSpots }}>
      {children}
    </DataContext.Provider>
  )
}
