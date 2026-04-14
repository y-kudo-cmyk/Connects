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

    // Service Workerを先に手動登録（iOS PWAで必要）
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/OneSignalSDKWorker.js', { scope: '/' })
      } catch (e) {
        console.warn('[OneSignal] SW registration failed:', e)
      }
    }

    await OneSignal.init({
      appId: APP_ID,
      safari_web_id: 'web.onesignal.auto.2068edc0-2ec7-4d8d-bc37-83913e3acbff',
      allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
      serviceWorkerPath: '/OneSignalSDKWorker.js',
    } as any)

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
 * 通知許可をユーザーに求める
 * iOS PWA では Slidedown が動かないため Notifications.requestPermission() を使う
 * ※ iOS ではユーザージェスチャー（ボタンタップ等）から呼ぶ必要がある
 */
export async function promptPush(): Promise<void> {
  const ready = await initPromise
  if (!ready) return

  // iOS PWA 判定
  const isIOSPWA = /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone)

  if (isIOSPWA) {
    // iOS PWA: ネイティブの通知許可ダイアログを使う
    await OneSignal.Notifications.requestPermission()
  } else {
    await OneSignal.Slidedown.promptPush()
  }
}
