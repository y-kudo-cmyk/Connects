import AnnouncementsSection from '@/components/AnnouncementsSection'
import TodayScheduleSection from '@/components/TodayScheduleSection'
import NewSchedulePreview from '@/components/NewSchedulePreview'
import TodoSection from '@/components/TodoSection'
import AddScheduleButton from '@/components/AddScheduleButton'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>

      {/* ─── 運営からのお知らせ ─── */}
      <div className="pt-4" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
        <AnnouncementsSection />
      </div>

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
