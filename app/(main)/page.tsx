import AnnouncementsSection from '@/components/AnnouncementsSection'
import TodayScheduleSection from '@/components/TodayScheduleSection'
import NewSchedulePreview from '@/components/NewSchedulePreview'
import TodoSection from '@/components/TodoSection'

export default function HomePage() {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>

      {/* ─── 運営からのお知らせ ─── */}
      <div className="pt-4" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
        <AnnouncementsSection />
      </div>

      {/* ─── 今日のスケジュール ─── */}
      <div className="pt-4">
        <TodayScheduleSection today={today} />
      </div>

      {/* ─── 新着スケジュール ─── */}
      <div className="pt-4">
        <NewSchedulePreview />
      </div>

      {/* ─── TODO ─── */}
      <div className="pt-4">
        <TodoSection />
      </div>

    </div>
  )
}
