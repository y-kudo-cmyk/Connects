'use client'

import { useAuth } from '@/lib/supabase/useAuth'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const MAX_USERS = 999999

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [full, setFull] = useState(false)

  useEffect(() => {
    if (!user) { setAllowed(null); return }

    async function checkAccess() {
      try {
        const email = user!.email || ''

        // profileがあるか確認
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user!.id)
          .maybeSingle()

        if (!profile) {
          // profileを作成 + glide_my_entriesを移行
          await fetch('/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        }

        setAllowed(true)

        // ログイン通知（セッションごとに1回）
        const ADMIN_IDS = ['86c91b90-0060-4a3d-bf10-d5c846604882', '65ba4bc6-917d-4689-aeaf-8d4b5b01a004']
        const notified = sessionStorage.getItem('login-notified')
        if (!notified && !ADMIN_IDS.includes(user!.id)) {
          sessionStorage.setItem('login-notified', '1')
          fetch('/api/notify-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'login', message: `🔔 ログイン\n${email}` }),
          }).catch(() => {})
        }
      } catch {
        setAllowed(true)
      }
    }

    checkAccess()
  }, [user])

  if (loading || (user && allowed === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FA' }}>
        <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F3B4E3', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) return null

  if (allowed === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F8F9FA' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#1C1C1E' }}>
          {full ? '定員に達しました' : 'アクセスが制限されています'}
        </h2>
        <p className="text-sm text-center leading-relaxed mb-6" style={{ color: '#8E8E93' }}>
          {full
            ? 'プロトタイプ版のテスター枠が定員に達しました。次回の募集をお待ちください。'
            : '現在プロトタイプ版のため、テスターのみご利用いただけます。'}
        </p>
        <button
          onClick={() => signOut()}
          className="px-6 py-3 rounded-2xl text-sm font-bold"
          style={{ background: '#F0F0F5', color: '#636366' }}>
          ログアウト
        </button>
      </div>
    )
  }

  return <>{children}</>
}
