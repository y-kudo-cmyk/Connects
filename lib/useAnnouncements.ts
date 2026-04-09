'use client'

import { useState, useEffect } from 'react'

export type Announcement = {
  id: string
  type: 'info' | 'important' | 'warning'
  title: string
  body: string
  date: string
  url?: string
}

const DISMISSED_KEY = 'cp-dismissed-announcements'

export function useAnnouncements(all: Announcement[]) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY)
      if (raw) setDismissed(new Set(JSON.parse(raw)))
    } catch {}
    setReady(true)
  }, [])

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const visible = ready ? all.filter((a) => !dismissed.has(a.id)) : []

  return { visible, dismiss }
}
