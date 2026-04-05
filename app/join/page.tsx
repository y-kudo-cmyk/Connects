'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useReferral } from '@/lib/useReferral'
import { useTranslation } from '@/lib/i18n/useTranslation'

const REFERRED_BY_KEY = 'cp-referred-by'

function JoinContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verified, verify } = useReferral()
  const { t } = useTranslation()

  const [status, setStatus] = useState<'checking' | 'success' | 'invalid'>('checking')
  const ref = searchParams.get('ref')?.toUpperCase() ?? ''

  useEffect(() => {
    if (!ref) { router.replace('/login'); return }

    // すでに認証済みならそのままログインへ
    if (verified) { router.replace('/login'); return }

    const validate = async () => {
      try {
        const res = await fetch('/api/validate-referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: ref }),
        })
        const data = await res.json() as { valid: boolean }
        if (data.valid) {
          try { localStorage.setItem(REFERRED_BY_KEY, ref) } catch {}
          verify()
          setStatus('success')
          const dest = localStorage.getItem('cp-onboarding-lang-done') ? '/login' : '/onboarding'
          setTimeout(() => router.replace(dest), 1800)
        } else {
          setStatus('invalid')
        }
      } catch {
        setStatus('invalid')
      }
    }

    if (verified === false) validate()
  }, [ref, verified, verify, router])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#F8F9FA' }}
    >
      <div className="w-20 h-20 rounded-3xl overflow-hidden mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="Connects+" className="w-full h-full object-cover" />
      </div>

      {status === 'checking' && (
        <>
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-4"
            style={{ borderColor: '#F3B4E3', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: '#8E8E93' }}>{t('inviteChecking')}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: '#F3B4E320' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-black mb-2" style={{ color: '#1C1C1E' }}>{t('inviteSuccess')}</h2>
          <p className="text-sm mb-1" style={{ color: '#8E8E93' }}>{t('inviteWelcome')}</p>
          <p className="text-xs" style={{ color: '#636366' }}>{t('inviteRedirect')}</p>
        </>
      )}

      {status === 'invalid' && (
        <>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: '#EF444420' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h2 className="text-xl font-black mb-2" style={{ color: '#1C1C1E' }}>{t('inviteInvalid')}</h2>
          <p className="text-sm mb-6" style={{ color: '#8E8E93' }}>
            {t('inviteExpired')}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 rounded-2xl text-sm font-bold"
            style={{ background: '#1E1E22', color: '#F3B4E3', border: '1px solid #F3B4E340' }}
          >
            {t('inviteGoLogin')}
          </button>
        </>
      )}
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FA' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#F3B4E3', borderTopColor: 'transparent' }} />
      </div>
    }>
      <JoinContent />
    </Suspense>
  )
}
