'use client'

import { useState } from 'react'

interface Props {
  nickname: string
  offerCount: number
  seekCount: number
}

export default function ShareActions({ nickname, offerCount, seekCount }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (typeof window === 'undefined') return
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // noop
    }
  }

  const buildTweetUrl = () => {
    if (typeof window === 'undefined') return '#'
    // X 公式の新 intent endpoint (twitter.com/intent/tweet は廃止予告あり)
    // ハッシュタグは日本語を含むので text 内に直接埋める (hashtags パラメータは欧文前提)
    const text = `【SEVENTEEN トレカ交換】
${nickname} です
譲 ${offerCount}枚 / 求 ${seekCount}枚
DMください🙏

#SEVENTEEN #セブチ #トレカ交換 #Connects`
    const params = new URLSearchParams({
      text,
      url: window.location.href,
    })
    return `https://x.com/intent/post?${params.toString()}`
  }

  return (
    <div className="mx-4 mt-2 mb-2 flex gap-2">
      <button
        onClick={handleCopy}
        className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
        style={{ background: '#FFFFFF', color: '#1C1C1E', border: '1px solid #E5E5EA' }}
      >
        {copied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ color: '#22C55E' }}>コピーしました</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            URLをコピー
          </>
        )}
      </button>
      {/* X に投稿ボタンは一旦非表示 (運用判断で後日復活予定) */}
      {false && (
        <a
          href={buildTweetUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          style={{ background: '#1C1C1E', color: '#FFFFFF' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Xに投稿
        </a>
      )}
    </div>
  )
}
