import Link from 'next/link'
import AnnouncementsSection from '@/components/AnnouncementsSection'
import TodayScheduleSection from '@/components/TodayScheduleSection'
import NewSchedulePreview from '@/components/NewSchedulePreview'
import TodoSection from '@/components/TodoSection'

export default function HomePage() {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>

      {/* ─── ヘッダー ─── */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4"
        style={{
          background: 'rgba(248,249,250,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E5E5EA',
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          paddingBottom: '12px',
        }}
      >
        <div />
        <div className="flex items-center gap-1">
          <Link
            href="/profile"
            className="w-11 h-11 flex items-center justify-center rounded-full"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.8">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* ─── 運営からのお知らせ ─── */}
      <div className="pt-4">
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
