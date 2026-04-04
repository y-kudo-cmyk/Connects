'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
    if (status === 'authenticated') {
      try {
        if (!localStorage.getItem('cp-onboarding-country-done')) {
          // 既にプロフィールに国が設定されていればフラグだけ立てる
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
  }, [status, router])

  if (status === 'loading' || status === 'unauthenticated') {
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
