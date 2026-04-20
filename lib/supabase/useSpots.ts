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
    // 個人情報（original_submitter_email）を除外した明示カラム
    const SPOT_COLS = 'id, spot_name, spot_address, spot_url, genre, artist_id, related_artists, image_url, source_url, memo, lat, lng, is_master, submitted_by, status, verified_count, x_posted, created_at, updated_at'
    const PHOTO_COLS = 'id, spot_id, image_url, source_url, platform, tags, contributor, visit_date, caption, status, votes, created_at, submitted_by'
    Promise.all([
      supabase.from('spots').select(SPOT_COLS).neq('status', 'deleted').order('spot_name'),
      supabase.from('spot_photos').select(PHOTO_COLS).neq('status', 'deleted'),
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
