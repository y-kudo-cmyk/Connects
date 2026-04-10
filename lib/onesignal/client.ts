import OneSignal from 'react-onesignal'

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID

let initPromise: Promise<boolean> | null = null

/**
 * OneSignal SDK を初期化（クライアントサイド専用）
 * APP_ID が未設定の場合は何もしない
 * 複数回呼ばれても安全（初期化は1回だけ実行）
 */
export async function initOneSignal(): Promise<boolean> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    if (!APP_ID) {
      console.warn('[OneSignal] NEXT_PUBLIC_ONESIGNAL_APP_ID is not set. Skipping initialization.')
      return false
    }
    if (typeof window === 'undefined') return false

    await OneSignal.init({
      appId: APP_ID,
      allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
    })

    return true
  })()

  return initPromise
}

/**
 * ログインユーザーを OneSignal に紐づけ
 * externalId = Supabase profiles.id
 */
export async function loginOneSignal(userId: string): Promise<void> {
  const ready = await initPromise
  if (!ready || !userId) return
  await OneSignal.login(userId)
}

/**
 * ログアウト時に OneSignal の紐づけを解除
 */
export async function logoutOneSignal(): Promise<void> {
  const ready = await initPromise
  if (!ready) return
  await OneSignal.logout()
}

/**
 * 通知許可をユーザーに求める（Slidedown表示）
 */
export async function promptPush(): Promise<void> {
  const ready = await initPromise
  if (!ready) return
  await OneSignal.Slidedown.promptPush()
}
