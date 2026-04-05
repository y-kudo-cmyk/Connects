'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { COUNTRIES, countryFlag } from '@/lib/countryUtils'
import { useReferral } from '@/lib/useReferral'
import { useTranslation } from '@/lib/i18n/useTranslation'

type Lang = 'ja' | 'en' | 'ko'
type Step = 'lang' | 'code'

const LANGUAGES: { code: Lang; flag: string; label: string; sub: string }[] = [
  { code: 'ja', flag: '🇯🇵', label: '日本語', sub: 'Japanese' },
  { code: 'en', flag: '🇺🇸', label: 'English', sub: '英語' },
  { code: 'ko', flag: '🇰🇷', label: '한국어', sub: 'Korean' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { verified, verify } = useReferral()
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('lang')
  const [lang, setLang] = useState<Lang | null>(null)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  // 既に言語設定済みならログインへ
  useEffect(() => {
    try {
      if (localStorage.getItem('cp-onboarding-lang-done')) {
        router.replace('/login')
      }
    } catch {}
  }, [router])

  const saveLang = (l: Lang) => {
    setLang(l)
    try {
      const existing = localStorage.getItem('cp-profile')
      const profile = existing ? JSON.parse(existing) : {}
      localStorage.setItem('cp-profile', JSON.stringify({ ...profile, language: l }))
    } catch {}
    // 招待コード検証済みならログインへ直行
    if (verified) {
      finishOnboarding()
    } else {
      setTimeout(() => setStep('code'), 150)
    }
  }

  const finishOnboarding = () => {
    try { localStorage.setItem('cp-onboarding-lang-done', '1') } catch {}
    router.replace('/login')
  }

  const handleVerifyCode = async () => {
    if (!code.trim()) { setCodeError('招待コードを入力してください'); return }
    setCodeLoading(true)
    setCodeError('')
    try {
      const res = await fetch('/api/validate-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })
      const data = await res.json() as { valid: boolean }
      if (data.valid) {
        verify()
        finishOnboarding()
      } else {
        setCodeError(t('onboardingCodeInvalid'))
      }
    } catch {
      setCodeError(t('onboardingCodeFailed'))
    }
    setCodeLoading(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6"
      style={{ background: '#FFFFFF', paddingTop: 'calc(48px + env(safe-area-inset-top, 0px))' }}
    >
      {/* ロゴ */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Connects+" style={{ width: 64, height: 'auto', marginBottom: 32 }} />

      {/* ステップ1: 言語 */}
      {step === 'lang' && (
        <>
          <div className="text-center mb-8">
            <p className="text-xl font-black mb-1" style={{ color: '#1C1C1E' }}>{t('onboardingLang')}</p>
            <p className="text-sm" style={{ color: '#8E8E93' }}>{t('onboardingLangSub')}</p>
          </div>
          <div className="w-full max-w-sm flex flex-col gap-3">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => saveLang(l.code)}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left"
                style={{ background: '#FFFFFF', border: '1.5px solid #E5E5EA' }}
              >
                <span style={{ fontSize: 32 }}>{l.flag}</span>
                <div>
                  <p className="text-base font-bold" style={{ color: '#1C1C1E' }}>{l.label}</p>
                  <p className="text-xs" style={{ color: '#8E8E93' }}>{l.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ステップ2: 招待コード */}
      {step === 'code' && (
        <>
          <div className="text-center mb-8">
            <p className="text-xl font-black mb-1" style={{ color: '#1C1C1E' }}>{t('onboardingCode')}</p>
            <p className="text-sm" style={{ color: '#8E8E93' }}>{t('onboardingCodeSub')}</p>
          </div>
          <div className="w-full max-w-sm flex flex-col gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError('') }}
              placeholder={t('onboardingCodePlaceholder')}
              maxLength={12}
              autoFocus
              className="w-full px-4 py-4 rounded-2xl text-base outline-none text-center font-mono tracking-widest"
              style={{ background: '#FFFFFF', border: '1.5px solid #E5E5EA', color: '#1C1C1E' }}
              onFocus={(e) => (e.target.style.borderColor = '#F3B4E3')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E5EA')}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
            />
            {codeError && (
              <p className="text-xs text-center" style={{ color: '#EF4444' }}>{codeError}</p>
            )}
            <button
              onClick={handleVerifyCode}
              disabled={codeLoading}
              className="w-full py-4 rounded-2xl text-sm font-bold"
              style={{
                background: codeLoading ? '#E5E5EA' : 'linear-gradient(135deg, #F3B4E3, #C97AB8)',
                color: codeLoading ? '#8E8E93' : '#FFFFFF',
              }}
            >
              {codeLoading ? t('onboardingCodeConfirming') : t('onboardingCodeConfirm')}
            </button>
            <button
              onClick={() => setStep('lang')}
              className="text-xs text-center py-2"
              style={{ color: '#8E8E93' }}
            >
              {t('onboardingBackToLang')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
