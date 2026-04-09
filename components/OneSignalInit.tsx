'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/supabase/useAuth'
import { initOneSignal, loginOneSignal, logoutOneSignal, promptPush } from '@/lib/onesignal/client'

/**
 * OneSignal 初期化コンポーネント
 * - レイアウトに配置するだけで動作
 * - ログイン状態に応じて externalId を自動紐づけ
 * - ログイン後に通知許可を自然に求める
 */
export default function OneSignalInit() {
  const { user } = useAuth()
  const prevUserId = useRef<string | null>(null)

  // SDK 初期化（1回だけ）
  useEffect(() => {
    initOneSignal()
  }, [])

  // ユーザー変更に応じて login / logout
  useEffect(() => {
    const userId = user?.id ?? null

    if (userId === prevUserId.current) return
    prevUserId.current = userId

    if (userId) {
      loginOneSignal(userId).then(() => {
        // ログイン直後に通知許可を求める
        promptPush()
      })
    } else {
      logoutOneSignal()
    }
  }, [user])

  return null
}
