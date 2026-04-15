'use client'

import { useState, useEffect } from 'react'

export default function PwaInstallBanner() {
  const [showInstall, setShowInstall] = useState(false)
  const [showNotif, setShowNotif] = useState(false)

  useEffect(() => {
    const isStandalone = ('standalone' in navigator && (navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches

    const installDismissed = localStorage.getItem('pwa-banner-dismissed')
    const notifDismissed = localStorage.getItem('notif-banner-dismissed')

    // ブラウザで開いている → ホーム画面追加を促す
    if (!isStandalone && !(installDismissed && Date.now() - parseInt(installDismissed) < 7 * 24 * 60 * 60 * 1000)) {
      setShowInstall(true)
    }

    // PWAで開いている or ブラウザでも → 通知未許可なら通知を促す
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      if (!(notifDismissed && Date.now() - parseInt(notifDismissed) < 24 * 60 * 60 * 1000)) {
        setShowNotif(true)
      }
    }
  }, [])

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)

  const handleEnableNotif = async () => {
    try {
      let result: string
      try {
        result = await new Promise<string>((resolve) => {
          const p = Notification.requestPermission((r: string) => resolve(r))
          if (p && typeof p.then === 'function') p.then(resolve)
        })
      } catch {
        result = Notification.permission
      }
      if (result === 'granted') {
        const { initOneSignal, loginOneSignal } = await import('@/lib/onesignal/client')
        await initOneSignal()
        const { createClient } = await import('@/lib/supabase/client')
        const sb = createClient()
        const { data: { user } } = await sb.auth.getUser()
        if (user) await loginOneSignal(user.id)
      }
    } catch {}
    setShowNotif(false)
    localStorage.setItem('notif-banner-dismissed', Date.now().toString())
  }

  return (
    <>
      {/* ホーム画面追加バナー */}
      {showInstall && (
        <div className="mx-4 mb-3 rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(243,180,227,0.15), rgba(129,140,248,0.1))', border: '1px solid rgba(243,180,227,0.3)' }}>
          <span className="text-2xl flex-shrink-0">📲</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold mb-1" style={{ color: '#1C1C1E' }}>
              ホーム画面に追加しよう
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#636366' }}>
              {isIOS
                ? 'ホーム画面から直接アクセスでき、フルスクリーンで快適に使えます。Safariの下の共有ボタン（□↑）→「ホーム画面に追加」'
                : 'ホーム画面から直接アクセスでき、フルスクリーンで快適に使えます。ブラウザメニュー →「ホーム画面に追加」'}
            </p>
          </div>
          <button onClick={() => {
            localStorage.setItem('pwa-banner-dismissed', Date.now().toString())
            setShowInstall(false)
          }}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.05)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* 通知設定バナー */}
      {showNotif && (
        <div className="mx-4 mb-3 rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(243,180,227,0.1))', border: '1px solid rgba(96,165,250,0.2)' }}>
          <span className="text-2xl flex-shrink-0">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold mb-1" style={{ color: '#1C1C1E' }}>
              通知をONにしよう
            </p>
            <p className="text-xs leading-relaxed mb-2" style={{ color: '#636366' }}>
              チケット申込締切や明日のスケジュールを見逃さない！毎朝・毎晩のお知らせで大事な情報をキャッチ
            </p>
            <button onClick={handleEnableNotif}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#F3B4E3', color: '#FFFFFF' }}>
              🔔 通知を許可する
            </button>
          </div>
          <button onClick={() => {
            localStorage.setItem('notif-banner-dismissed', Date.now().toString())
            setShowNotif(false)
          }}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.05)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
