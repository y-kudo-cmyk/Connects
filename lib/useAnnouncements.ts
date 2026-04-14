'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/supabase/useAuth'

export type Announcement = {
  id: string
  type: 'info' | 'important' | 'warning'
  title: string
  body: string
  date: string
  url?: string
}

export function useAnnouncements(all: Announcement[]) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)
  const { user } = useAuth()
  const key = `cp-dismissed-announcements-${user?.id || 'anon'}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) setDismissed(new Set(JSON.parse(raw)))
    } catch {}
    setReady(true)
  }, [key])

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem(key, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const visible = ready ? all.filter((a) => !dismissed.has(a.id)) : []

  return { visible, dismiss }
}
