'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/supabase/useAuth'

const supabase = createClient()

export function useFavoriteSpots() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const fetchFavorites = useCallback(async () => {
    if (!user) { setFavorites(new Set()); return }
    const { data } = await supabase
      .from('favorite_spots')
      .select('spot_id')
      .eq('user_id', user.id)
    if (data) setFavorites(new Set(data.map((d) => d.spot_id)))
  }, [user])

  useEffect(() => { fetchFavorites() }, [fetchFavorites])

  const toggle = useCallback(async (id: string) => {
    if (!user) return
    if (favorites.has(id)) {
      await supabase.from('favorite_spots').delete().eq('user_id', user.id).eq('spot_id', id)
    } else {
      await supabase.from('favorite_spots').insert({ user_id: user.id, spot_id: id })
    }
    await fetchFavorites()
  }, [user, favorites, fetchFavorites])

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites])

  return { favorites, toggle, isFavorite, count: favorites.size }
}
