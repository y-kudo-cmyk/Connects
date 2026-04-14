'use client'

import { useAuth } from '@/lib/supabase/useAuth'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const MAX_USERS = 16

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [full, setFull] = useState(false)

  useEffect(() => {
    if (!user) { setAllowed(null); return }

    async function checkAccess() {
      const email = user!.email
      if (!email) { setAllowed(false); return }

      // glide_usersにメールが存在するか確認
      const normalized = email.toLowerCase().trim()
      const { data } = await supabase
        .from('glide_users')
        .select('mail')
        .ilike('mail', normalized)
        .limit(1)

      if (data && data.length > 0) {
        setAllowed(true)
        return
      }

      // 人数制限チェック（既存ユーザー以外）
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      if ((count ?? 0) >= MAX_USERS) {
        setFull(true)
        setAllowed(false)
        return
      }

      setAllowed(false)
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
