'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/supabase/useAuth'
import type { PilgrimageSpot } from './config/constants'

const supabase = createClient()

export type UserSpot = PilgrimageSpot & {
  isUserSubmitted: true
  submitter?: string
  submittedAt: string
}

export function useUserSpots() {
  const { user } = useAuth()
  const [userSpots, setUserSpots] = useState<UserSpot[]>([])

  const fetchSpots = useCallback(async () => {
    if (!user) { setUserSpots([]); return }
    const { data } = await supabase
      .from('spots')
      .select('*')
      .eq('submitted_by', user.id)
      .order('created_at', { ascending: false })
    if (data) {
      setUserSpots(data.map((s) => ({
        id: s.id,
        name: s.spot_name ?? '',
        nameLocal: '',
        address: s.spot_address ?? '',
        city: '',
        genre: (s.genre ?? '') as PilgrimageSpot['genre'],
        members: s.related_artists ? s.related_artists.split(',').map((a: string) => a.trim()) : [],
        description: s.memo ?? '',
        lat: s.lat ?? 0,
        lng: s.lng ?? 0,
        officialUrl: s.spot_url ?? undefined,
        sourceUrl: s.source_url ?? undefined,
        photos: [],
        isUserSubmitted: true as const,
        submitter: user.id,
        submittedAt: s.created_at ?? '',
      })))
    }
  }, [user])

  useEffect(() => { fetchSpots() }, [fetchSpots])

  const addSpot = useCallback(async (spot: UserSpot) => {
    if (!user) return
    await supabase.from('spots').insert({
      id: spot.id,
      spot_name: spot.name,
      spot_address: spot.address,
      lat: spot.lat,
      lng: spot.lng,
      genre: spot.genre || null,
      artist_id: null,
      related_artists: spot.members?.join(', ') || null,
      image_url: null,
      spot_url: spot.officialUrl || null,
      source_url: spot.sourceUrl || null,
      memo: spot.description || null,
      submitted_by: user.id,
      status: 'pending',
      verified_count: 0,
    })
    await fetchSpots()
  }, [user, fetchSpots])

  const removeSpot = useCallback(async (id: string) => {
    await supabase.from('spots').update({ status: 'deleted' }).eq('id', id)
    await fetchSpots()
  }, [fetchSpots])

  return { userSpots, addSpot, removeSpot }
}
