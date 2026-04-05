'use client'

// Supabase Auth はプロバイダー不要（クライアント側で直接利用）
export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
