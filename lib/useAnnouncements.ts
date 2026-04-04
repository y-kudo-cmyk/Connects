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

// DB連携前のモックデータ
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    type: 'important',
    title: 'Connects+ へようこそ！',
    body: 'スケジュール・MAP・GOODSなど機能を順次公開中です。投稿・承認でグレードアップ！',
    date: '2026-04-01',
  },
  {
    id: 'ann-2',
    type: 'info',
    title: 'スケジュール投稿機能 公開',
    body: 'みなさんのスケジュール投稿をお待ちしています。3人の確認で公開されます。',
    date: '2026-04-02',
  },
]

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
