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

  useEffect(() => {
    if (!user) { setReady(true); return }
    import('@/lib/supabase/client').then(({ createClient }) => {
      const sb = createClient()
      sb.from('user_dismissals').select('target_id').eq('user_id', user.id).eq('type', 'announcement')
        .then(({ data }) => {
          if (data) setDismissed(new Set(data.map((d: { target_id: string }) => d.target_id)))
          setReady(true)
        })
    })
  }, [user])

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    if (user) {
      import('@/lib/supabase/client').then(({ createClient }) => {
        const sb = createClient()
        sb.from('user_dismissals').upsert({ user_id: user.id, type: 'announcement', target_id: id }).then(() => {})
      })
    }
  }

  const visible = ready ? all.filter((a) => !dismissed.has(a.id)) : []

  return { visible, dismiss }
}
