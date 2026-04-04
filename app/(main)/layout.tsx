import TabBar from '@/components/TabBar'
import AuthGuard from '@/components/AuthGuard'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex flex-col h-full" style={{ background: '#F8F9FA' }}>
        <main
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </main>
        <TabBar />
      </div>
    </AuthGuard>
  )
}
