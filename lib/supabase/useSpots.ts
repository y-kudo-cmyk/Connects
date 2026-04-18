'use client'

import { useState, useEffect } from 'react'
import { createClient } from './client'

const supabase = createClient()

export type SupabaseSpot = {
  id: string
  spot_name: string
  spot_address: string
  spot_url: string
  genre: string
  artist_id: string
  related_artists: string
  image_url: string
  source_url: string
  memo: string
  lat: number | null
  lng: number | null
  is_master: boolean
  status: string
  verified_count: number
  x_posted: boolean
  submitted_by: string | null
  submitter?: { nickname: string } | null
  created_at?: string
}

export type SupabaseSpotPhoto = {
  id: string
  spot_id: string
  image_url: string
  source_url: string
  platform: string
  tags: string
  contributor: string
  visit_date: string | null
  caption: string
  status: string
  votes: number
}

export function useSpots() {
  const [spots, setSpots] = useState<SupabaseSpot[]>([])
  const [photos, setPhotos] = useState<SupabaseSpotPhoto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('spots').select('*').order('spot_name'),
      supabase.from('spot_photos').select('*'),
    ]).then(([spotsRes, photosRes]) => {
      if (spotsRes.error) console.error('Spots fetch error:', spotsRes.error.message)
      else setSpots(spotsRes.data ?? [])
      if (photosRes.error) console.error('Photos fetch error:', photosRes.error.message)
      else setPhotos(photosRes.data ?? [])
      setLoading(false)
    })
  }, [])

  const getPhotosForSpot = (spotId: string) =>
    photos.filter(p => p.spot_id === spotId)

  return { spots, photos, loading, getPhotosForSpot }
}
