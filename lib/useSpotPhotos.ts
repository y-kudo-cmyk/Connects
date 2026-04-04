'use client'

import { useState, useEffect, useCallback } from 'react'
import { SpotPhoto } from './mockData'

const KEY = 'cp-spot-photos'

type PhotoMap = Record<string, SpotPhoto[]>

export function useSpotPhotos() {
  const [photoMap, setPhotoMap] = useState<PhotoMap>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setPhotoMap(JSON.parse(raw))
    } catch {}
  }, [])

  const addPhoto = useCallback((spotId: string, photo: SpotPhoto) => {
    setPhotoMap((prev) => {
      const next = { ...prev, [spotId]: [...(prev[spotId] ?? []), photo] }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const removePhoto = useCallback((spotId: string, photoId: string) => {
    setPhotoMap((prev) => {
      const next = { ...prev, [spotId]: (prev[spotId] ?? []).filter((p) => p.id !== photoId) }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const votePhoto = useCallback((spotId: string, photoId: string) => {
    setPhotoMap((prev) => {
      const next = {
        ...prev,
        [spotId]: (prev[spotId] ?? []).map((p) => {
          if (p.id !== photoId) return p
          const votes = (p.votes ?? 0) + 1
          return { ...p, votes, status: votes >= 3 ? 'confirmed' as const : 'pending' as const }
        }),
      }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const getPhotos = useCallback(
    (spotId: string): SpotPhoto[] => photoMap[spotId] ?? [],
    [photoMap],
  )

  const getConfirmedCount = useCallback(
    (spotId: string): number => (photoMap[spotId] ?? []).filter((p) => p.status === 'confirmed').length,
    [photoMap],
  )

  return { photoMap, addPhoto, removePhoto, votePhoto, getPhotos, getConfirmedCount }
}
