'use client'

import { useAuth } from '@/lib/supabase/useAuth'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import NicknameSetupOverlay from './NicknameSetupOverlay'
import NotificationSetupOverlay from './NotificationSetupOverlay'

const supabase = createClient()

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const t = useTranslations()
  const [banned, setBanned] = useState(false)
  const [needNickname, setNeedNickname] = useState(false)
  const [needNotifSetup, setNeedNotifSetup] = useState(false)
  const checkedRef = useRef(false)

  useEffect(() => {
    if (!user || checkedRef.current) return
    checkedRef.current = true

    ;(async () => {
      try {
        // 1回目: 通常フェッチ (RLS 経由)
        let { data: profile } = await supabase
          .from('profiles')
          .select('id, role, mail, nickname, notif_setup_done')
          .eq('id', user.id)
          .maybeSingle()

        // RLS タイミング問題で null の時は create-profile API (service role) を叩いた上で再フェッチ
        // これで既存 profile が「未読み込み」状態で setup overlay が誤発動するのを防ぐ
        if (!profile) {
          await fetch('/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }).catch(() => {})
          const retry = await supabase
            .from('profiles')
            .select('id, role, mail, nickname, notif_setup_done')
            .eq('id', user.id)
            .maybeSingle()
          profile = retry.data
        }

        if (!profile) {
          // 本当に作成できなかった場合だけ setup overlay (RLS 問題ではない真の新規)
          setNeedNickname(true)
          setNeedNotifSetup(true)
          return
        }
        if (profile.role === 'banned') {
          setBanned(true)
          return
        }

        if ((!profile.mail || profile.mail === '') && user.email) {
          await fetch('/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }).catch(() => {})
        }
        // nickname 未設定なら設定画面
        if (!profile.nickname || profile.nickname.trim() === '') {
          setNeedNickname(true)
        }
        // 通知設定を選ばせる
        if (!profile.notif_setup_done) {
          setNeedNotifSetup(true)
        }

        // ログイン記録 + 通知（30分に1回まで）
        const ADMIN_IDS = ['86c91b90-0060-4a3d-bf10-d5c846604882', '65ba4bc6-917d-4689-aeaf-8d4b5b01a004']
        const lastNotified = localStorage.getItem('login-notified-at')
        const now = Date.now()
        const throttle = 30 * 60 * 1000 // 30分
        if (!lastNotified || now - Number(lastNotified) > throttle) {
          localStorage.setItem('login-notified-at', String(now))
          // アクティビティ記録
          supabase.from('user_activity').insert({ user_id: user.id, action: 'login', detail: '' }).then(() => {})
          // 管理者通知
          if (!ADMIN_IDS.includes(user.id)) {
            fetch('/api/notify-admin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'login', message: `🔔 ログイン\n${user.email || ''}` }),
            }).catch(() => {})
          }
        }
      } catch {
        // プロフィール作成失敗してもアクセスは許可
      }
    })()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FA' }}>
        <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F3B4E3', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) return null

  if (banned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F8F9FA' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#1C1C1E' }}>{t('AuthGuard.accessRestricted')}</h2>
        <p className="text-sm text-center leading-relaxed mb-6" style={{ color: '#8E8E93' }}>
          {t('AuthGuard.accountSuspended')}
        </p>
        <button
          onClick={() => signOut()}
          className="px-6 py-3 rounded-2xl text-sm font-bold"
          style={{ background: '#F0F0F5', color: '#636366' }}>
          {t('AuthGuard.logout')}
        </button>
      </div>
    )
  }

  return (
    <>
      {children}
      {/* 先に nickname、nickname 設定済なら通知設定の順で表示 */}
      {needNickname && user && (
        <NicknameSetupOverlay userId={user.id} onDone={() => setNeedNickname(false)} />
      )}
      {!needNickname && needNotifSetup && user && (
        <NotificationSetupOverlay userId={user.id} onDone={() => setNeedNotifSetup(false)} />
      )}
    </>
  )
}
