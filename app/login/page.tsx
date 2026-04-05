'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/supabase/useAuth'

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithTwitter, signInWithEmail } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/')
  }, [loading, user, router])

  useEffect(() => {
    try {
      if (!localStorage.getItem('cp-onboarding-lang-done')) {
        router.replace('/onboarding')
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEmailLogin = async () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailError('メールアドレスを正しく入力してください')
      return
    }
    setEmailLoading(true)
    try {
      await signInWithEmail(email.trim())
      setEmailSent(true)
    } catch (e: any) {
      console.error('Email login error:', e)
      setEmailError(e?.message || 'ログインに失敗しました')
    }
    setEmailLoading(false)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#FFFFFF' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(243,180,227,0.15)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#1C1C1E' }}>メールを確認してください</h2>
        <p className="text-sm text-center leading-relaxed" style={{ color: '#8E8E93' }}>
          {email} にログインリンクを送信しました。
          <br />メール内のリンクをタップしてログインしてください。
        </p>
        <button
          onClick={() => setEmailSent(false)}
          className="mt-6 text-sm font-bold"
          style={{ color: '#F3B4E3' }}
        >
          戻る
        </button>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#FFFFFF' }}
    >
      {/* ロゴ */}
      <div className="flex flex-col items-center mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Connects+" className="mb-2" style={{ width: 80, height: 'auto' }} />
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <div className="text-center mb-2">
          <p className="text-sm" style={{ color: '#8E8E93' }}>ログイン方法を選択</p>
        </div>

        {/* Google */}
        <button
          onClick={() => signInWithGoogle()}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold"
          style={{ background: '#FFFFFF', color: '#1C1C1E', border: '1px solid #E5E5EA' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="flex-1 text-center">Googleでログイン</span>
        </button>

        {/* X */}
        <button
          onClick={() => signInWithTwitter()}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold"
          style={{ background: '#000000', color: '#FFFFFF' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span className="flex-1 text-center">X（Twitter）でログイン</span>
        </button>

        {/* 区切り */}
        <div className="relative flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: '#E5E5EA' }} />
          <span className="text-xs" style={{ color: '#C7C7CC' }}>またはメールで</span>
          <div className="flex-1 h-px" style={{ background: '#E5E5EA' }} />
        </div>

        {/* メール */}
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
          placeholder="example@email.com"
          className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none"
          style={{ background: '#FFFFFF', border: '1.5px solid #E5E5EA', color: '#1C1C1E' }}
          onFocus={(e) => (e.target.style.borderColor = '#F3B4E3')}
          onBlur={(e) => (e.target.style.borderColor = '#E5E5EA')}
          onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
        />
        {emailError && (
          <p className="text-xs text-center" style={{ color: '#EF4444' }}>{emailError}</p>
        )}
        <button
          onClick={handleEmailLogin}
          disabled={emailLoading}
          className="w-full py-3.5 rounded-2xl text-sm font-bold"
          style={{
            background: '#FFFFFF',
            color: emailLoading ? '#C7C7CC' : '#F3B4E3',
            border: '1.5px solid #F3B4E340',
          }}
        >
          {emailLoading ? 'ログイン中...' : 'メールでログイン'}
        </button>
      </div>

      <p className="text-center text-xs mt-8 leading-relaxed" style={{ color: '#C7C7CC' }}>
        ログインすることで、利用規約と
        <br />プライバシーポリシーに同意したものとみなします。
      </p>
    </div>
  )
}
