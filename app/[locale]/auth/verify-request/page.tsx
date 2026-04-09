'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function VerifyRequestPage() {
  const t = useTranslations()
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#FFFFFF' }}
    >
      <div className="flex flex-col items-center gap-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Connects+" style={{ width: 72, height: 'auto' }} />

        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(243,180,227,0.15)', border: '1px solid #F3B4E330' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="1.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <div>
          <p className="text-lg font-bold mb-2" style={{ color: '#1C1C1E' }}>
            {t('Auth.verifyEmailTitle')}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#8E8E93' }}>
            {t('Auth.verifyEmailSent')}
            <br />
            {t('Auth.verifyEmailCheck')}
          </p>
        </div>

        <Link
          href="/login"
          className="px-6 py-3 rounded-2xl text-sm font-bold"
          style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}
        >
          {t('Auth.backToLogin')}
        </Link>
      </div>
    </div>
  )
}
