'use client'

import { useState, useEffect } from 'react'
import { createClient } from './client'

const supabase = createClient()

export type SupabaseEvent = {
  id: string
  tag: string
  artist_id: string
  related_artists: string
  event_title: string
  sub_event_title: string
  start_date: string | null
  end_date: string | null
  spot_name: string
  spot_address: string
  lat: number | null
  lng: number | null
  country: string
  image_url: string
  source_url: string
  notes: string
  status: string
  verified_count: number
  submitted_by: string | null
  submitter?: { nickname: string } | null
}

export function useEvents() {
  const [events, setEvents] = useState<SupabaseEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('events')
      .select('*, submitter:profiles!submitted_by(nickname)')
      .order('start_date', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Events fetch error:', error.message)
        else setEvents(data ?? [])
        setLoading(false)
      })
  }, [])

  return { events, loading }
}
