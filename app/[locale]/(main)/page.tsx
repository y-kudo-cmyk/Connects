import AnnouncementsSection from '@/components/AnnouncementsSection'
import TodayScheduleSection from '@/components/TodayScheduleSection'
import NewSchedulePreview from '@/components/NewSchedulePreview'
import TodoSection from '@/components/TodoSection'
import AddScheduleButton from '@/components/AddScheduleButton'
import { createClient } from '@/lib/supabase/server'
import type { Announcement } from '@/lib/useAnnouncements'

function priorityToType(priority: number): Announcement['type'] {
  if (priority >= 2) return 'important'
  if (priority === 1) return 'warning'
  return 'info'
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('announcements')
    .select('id, title, body, link_url, priority, created_at')
    .eq('published', true)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  const announcements: Announcement[] = (data ?? []).map((a) => ({
    id: a.id,
    type: priorityToType(a.priority),
    title: a.title,
    body: a.body ?? '',
    date: a.created_at,
    url: a.link_url || undefined,
  }))

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>

      {/* ─── 運営からのお知らせ ─── */}
      <div className="pt-4" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
        <AnnouncementsSection announcements={announcements} />
      </div>

      {/* ─── 新着スケジュール ─── */}
      <div className="pt-4">
        <NewSchedulePreview />
      </div>

      {/* ─── 今日のスケジュール ─── */}
      <div className="pt-4">
        <TodayScheduleSection />
      </div>

      {/* ─── スケジュール投稿 ─── */}
      <div className="pt-3 px-4">
        <AddScheduleButton />
      </div>

      {/* ─── TODO ─── */}
      <div className="pt-4">
        <TodoSection />
      </div>

    </div>
  )
}
