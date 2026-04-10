'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { COUNTRIES, countryFlag } from '@/lib/countryUtils'
import { useTranslations } from 'next-intl'

export default function CountryPage() {
  const router = useRouter()
  const t = useTranslations()
  const [country, setCountry] = useState<string | null>(null)

  const finish = () => {
    if (!country) return
    try {
      const existing = localStorage.getItem('cp-profile')
      const profile = existing ? JSON.parse(existing) : {}
      localStorage.setItem('cp-profile', JSON.stringify({ ...profile, country }))
      localStorage.setItem('cp-onboarding-country-done', '1')
    } catch {}
    router.replace('/profile')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6"
      style={{ background: '#FFFFFF', paddingTop: 'calc(48px + env(safe-area-inset-top, 0px))' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Connects+" style={{ width: 56, height: 'auto', marginBottom: 28 }} />

      <div className="text-center mb-6">
        <p className="text-xl font-black mb-1" style={{ color: '#1C1C1E' }}>{t('Onboarding.onboardingCountry')}</p>
        <p className="text-sm" style={{ color: '#8E8E93' }}>{t('Onboarding.onboardingCountrySub')}</p>
      </div>

      <div className="w-full max-w-sm flex-1 overflow-y-auto pb-36">
        <div className="grid grid-cols-2 gap-2">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCountry(c.code)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-left"
              style={{
                background: country === c.code ? 'rgba(243,180,227,0.12)' : '#FFFFFF',
                border: `1.5px solid ${country === c.code ? '#F3B4E3' : '#E5E5EA'}`,
              }}
            >
              <span style={{ fontSize: 22 }}>{countryFlag(c.code)}</span>
              <span className="text-sm font-semibold truncate"
                style={{ color: country === c.code ? '#C97AB8' : '#1C1C1E' }}>
                {c.nameJa}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 固定ボタン */}
      <div
        className="fixed bottom-0 left-0 right-0 px-6 pt-6"
        style={{
          background: 'linear-gradient(to top, #FFFFFF 70%, transparent)',
          paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
        }}
      >
        <button
          onClick={finish}
          disabled={!country}
          className="w-full max-w-sm mx-auto block py-4 rounded-2xl text-sm font-bold"
          style={{
            background: country ? 'linear-gradient(135deg, #F3B4E3, #C97AB8)' : '#E5E5EA',
            color: country ? '#FFFFFF' : '#9A9A9F',
          }}
        >
          {country
            ? `${countryFlag(country)} ${COUNTRIES.find((c) => c.code === country)?.nameJa} で始める`
            : t('Onboarding.onboardingCountrySelect')}
        </button>
      </div>
    </div>
  )
}
