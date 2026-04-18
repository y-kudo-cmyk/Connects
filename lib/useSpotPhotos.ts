'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/supabase/useAuth'

const supabase = createClient()

export type SpotPhoto = {
  id: string
  imageUrl: string
  sourceUrl: string
  platform: string
  tags: string[]
  contributor: string
  date: string
  caption?: string
  votes: number
  status: 'pending' | 'confirmed'
}

type DbSpotPhoto = {
  id: string
  spot_id: string
  image_url: string
  source_url: string
  platform: string
  tags: string
  contributor: string
  visit_date: string | null
  votes: number
  status: string
}

function toApp(row: DbSpotPhoto): SpotPhoto {
  return {
    id: row.id,
    imageUrl: row.image_url ?? '',
    sourceUrl: row.source_url ?? '',
    platform: row.platform ?? '',
    tags: row.tags ? row.tags.split('#').map(t => t.trim()).filter(Boolean) : [],
    contributor: row.contributor ?? '',
    date: row.visit_date ?? '',
    votes: row.votes ?? 0,
    status: (row.status as 'pending' | 'confirmed') ?? 'pending',
  }
}

export function useSpotPhotos() {
  const { user } = useAuth()
  const [photoMap, setPhotoMap] = useState<Record<string, SpotPhoto[]>>({})

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from('spot_photos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      const map: Record<string, SpotPhoto[]> = {}
      for (const row of data as DbSpotPhoto[]) {
        if (!map[row.spot_id]) map[row.spot_id] = []
        map[row.spot_id].push(toApp(row))
      }
      setPhotoMap(map)
    }
  }, [])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  const addPhoto = useCallback(async (spotId: string, photo: SpotPhoto) => {
    if (!user) return
    await supabase.from('spot_photos').insert({
      spot_id: spotId,
      image_url: photo.imageUrl,
      source_url: photo.sourceUrl || null,
      platform: photo.platform || null,
      tags: photo.tags?.length ? photo.tags.map(t => `#${t}`).join(' ') : null,
      contributor: photo.contributor || null,
      submitted_by: user.id,
      visit_date: photo.date || null,
      status: 'pending',
      votes: 0,
    })
    await fetchPhotos()
  }, [user, fetchPhotos])

  const removePhoto = useCallback(async (_spotId: string, photoId: string) => {
    await supabase.from('spot_photos').delete().eq('id', photoId)
    await fetchPhotos()
  }, [fetchPhotos])

  const votePhoto = useCallback(async (spotId: string, photoId: string) => {
    if (!user) return
    await supabase.from('spot_photo_votes').insert({
      photo_id: photoId,
      user_id: user.id,
    })
    await fetchPhotos()
  }, [user, fetchPhotos])

  const getPhotos = useCallback(
    (spotId: string): SpotPhoto[] => photoMap[spotId] ?? [],
    [photoMap],
  )

  const getConfirmedCount = useCallback(
    (spotId: string): number => (photoMap[spotId] ?? []).filter((p) => p.status === 'confirmed').length,
    [photoMap],
  )

  return { photoMap, addPhoto, removePhoto, votePhoto, getPhotos, getConfirmedCount, refreshPhotos: fetchPhotos }
}
