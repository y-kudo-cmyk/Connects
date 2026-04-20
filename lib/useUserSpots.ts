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
    // original_submitter_email 除外
    const COLS = 'id, spot_name, spot_address, spot_url, genre, artist_id, related_artists, image_url, source_url, memo, lat, lng, is_master, submitted_by, status, verified_count, created_at'
    const { data } = await supabase
      .from('spots')
      .select(COLS)
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
    await supabase.from('user_activity').insert({
      user_id: user.id,
      action: 'post_spot',
      detail: JSON.stringify({ spot_id: spot.id, spot_name: spot.name, address: spot.address }),
    })
    await fetchSpots()
  }, [user, fetchSpots])

  const removeSpot = useCallback(async (id: string) => {
    const { data: before } = await supabase.from('spots').select('spot_name, spot_address, submitted_by').eq('id', id).maybeSingle()
    await supabase.from('spots').update({ status: 'deleted' }).eq('id', id)
    if (user) {
      await supabase.from('user_activity').insert({
        user_id: user.id,
        action: 'delete_spot',
        detail: JSON.stringify({ spot_id: id, spot_name: before?.spot_name, address: before?.spot_address, original_submitter: before?.submitted_by }),
      })
    }
    await fetchSpots()
  }, [user, fetchSpots])

  return { userSpots, addSpot, removeSpot }
}
