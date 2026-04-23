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

  // SDK 初期化（1回だけ）— TTI 後に defer して初回描画をブロックしない
  useEffect(() => {
    const run = () => initOneSignal()
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }
    const w = window as IdleWindow
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(run, { timeout: 3000 })
    } else {
      // iOS Safari 等 requestIdleCallback 未対応環境は setTimeout 2s fallback
      setTimeout(run, 2000)
    }
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
