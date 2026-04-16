import TabBar from '@/components/TabBar'
import AuthGuard from '@/components/AuthGuard'
import SupabaseDataProvider from '@/components/SupabaseDataProvider'
import TabContainer from '@/components/TabContainer'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SupabaseDataProvider>
        <div className="flex flex-col h-full" style={{ background: '#F8F9FA' }}>
          <TabContainer>{children}</TabContainer>
          <TabBar />
        </div>
      </SupabaseDataProvider>
    </AuthGuard>
  )
}
