'use client'

import { useState, useEffect, useCallback } from 'react'
import { PilgrimageSpot } from './mockData'

const KEY = 'cp-user-spots'

export type UserSpot = PilgrimageSpot & {
  isUserSubmitted: true
  submitter?: string
  submittedAt: string
}

export function useUserSpots() {
  const [userSpots, setUserSpots] = useState<UserSpot[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setUserSpots(JSON.parse(raw))
    } catch {}
  }, [])

  const addSpot = useCallback((spot: UserSpot) => {
    setUserSpots((prev) => {
      const next = [...prev, spot]
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const removeSpot = useCallback((id: string) => {
    setUserSpots((prev) => {
      const next = prev.filter((s) => s.id !== id)
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { userSpots, addSpot, removeSpot }
}
