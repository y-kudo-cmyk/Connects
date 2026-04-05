'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/useAuth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
    if (!loading && user) {
      try {
        if (!localStorage.getItem('cp-onboarding-country-done')) {
          const raw = localStorage.getItem('cp-profile')
          const country = raw ? JSON.parse(raw)?.country : null
          if (country) {
            localStorage.setItem('cp-onboarding-country-done', '1')
          } else {
            router.replace('/onboarding/country')
          }
        }
      } catch {}
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#FFFFFF' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Connects+" className="animate-pulse" style={{ width: 72, height: 'auto' }} />
      </div>
    )
  }

  return <>{children}</>
}
