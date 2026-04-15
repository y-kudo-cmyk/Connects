'use client'

import { useState, useEffect } from 'react'

export default function PwaInstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // ホーム画面から開いている場合は表示しない
    const isStandalone = ('standalone' in navigator && (navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    // 既に閉じた場合は24時間非表示
    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return

    setShow(true)
  }, [])

  if (!show) return null

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)

  return (
    <div className="mx-4 mb-3 rounded-2xl p-4 flex items-start gap-3"
      style={{ background: 'linear-gradient(135deg, rgba(243,180,227,0.15), rgba(129,140,248,0.1))', border: '1px solid rgba(243,180,227,0.3)' }}>
      <span className="text-2xl flex-shrink-0">📲</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold mb-1" style={{ color: '#1C1C1E' }}>
          ホーム画面に追加しよう
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#636366' }}>
          {isIOS
            ? 'Safariの共有ボタン → 「ホーム画面に追加」でアプリとして使えます。通知も受け取れます。'
            : 'ブラウザのメニュー → 「ホーム画面に追加」でアプリとして使えます。'}
        </p>
      </div>
      <button onClick={() => {
        localStorage.setItem('pwa-banner-dismissed', Date.now().toString())
        setShow(false)
      }}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.05)' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
