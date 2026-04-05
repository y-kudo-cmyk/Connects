'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toAppEvent, toAppSpot, type AppEvent, type AppSpot } from '@/lib/supabase/adapters'
import type { SupabaseSpotPhoto } from '@/lib/supabase/useSpots'

const supabase = createClient()

type DataContextType = {
  events: AppEvent[]
  spots: AppSpot[]
  loading: boolean
}

const DataContext = createContext<DataContextType>({ events: [], spots: [], loading: true })

export function useSupabaseData() {
  return useContext(DataContext)
}

export default function SupabaseDataProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [spots, setSpots] = useState<AppSpot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('events').select('*').order('start_date', { ascending: true }),
      supabase.from('spots').select('*').order('spot_name'),
      supabase.from('spot_photos').select('*'),
    ]).then(([eventsRes, spotsRes, photosRes]) => {
      if (eventsRes.data) {
        setEvents(eventsRes.data.map(toAppEvent))
      }
      if (spotsRes.data && photosRes.data) {
        const photos = photosRes.data as SupabaseSpotPhoto[]
        setSpots(spotsRes.data.map(s => toAppSpot(s, photos.filter(p => p.spot_id === s.id))))
      }
      setLoading(false)
    })
  }, [])

  return (
    <DataContext.Provider value={{ events, spots, loading }}>
      {children}
    </DataContext.Provider>
  )
}
