'use client'

import { useState, useEffect } from 'react'
import AnnouncementsSection from '@/components/AnnouncementsSection'
import TodayScheduleSection from '@/components/TodayScheduleSection'
import NewSchedulePreview from '@/components/NewSchedulePreview'
import TodoSection from '@/components/TodoSection'
import AddScheduleButton from '@/components/AddScheduleButton'
import PwaInstallBanner from '@/components/PwaInstallBanner'
import { createClient } from '@/lib/supabase/client'
import type { Announcement } from '@/lib/useAnnouncements'

const supabase = createClient()

function priorityToType(priority: number): Announcement['type'] {
  if (priority >= 2) return 'important'
  if (priority === 1) return 'warning'
  return 'info'
}

export default function HomeContent() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    supabase
      .from('announcements')
      .select('id, title, body, link_url, priority, created_at, title_en, body_en, title_ko, body_ko')
      .eq('published', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAnnouncements(
          (data ?? []).map((a) => ({
            id: a.id,
            type: priorityToType(a.priority),
            title: a.title,
            body: a.body ?? '',
            date: a.created_at,
            url: a.link_url || undefined,
            title_en: a.title_en || '',
            body_en: a.body_en || '',
            title_ko: a.title_ko || '',
            body_ko: a.body_ko || '',
          }))
        )
      })
  }, [])

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>

      {/* ─── 運営からのお知らせ ─── */}
      <div className="pt-4" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
        <AnnouncementsSection announcements={announcements} />
      </div>

      {/* ─── ホーム画面追加バナー ─── */}
      <PwaInstallBanner />

      {/* ─── スケジュール投稿 ─── */}
      <div className="pt-4 px-4">
        <AddScheduleButton />
      </div>

      {/* ─── 新着スケジュール ─── */}
      <div className="pt-4">
        <NewSchedulePreview />
      </div>

      {/* ─── 今日のスケジュール ─── */}
      <div className="pt-4">
        <TodayScheduleSection />
      </div>

      {/* ─── TODO ─── */}
      <div className="pt-4">
        <TodoSection />
      </div>

    </div>
  )
}
