'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { CardProduct, UserCard } from '@/lib/useCardData'

interface Props {
  userId: string
  locale: string
  products: CardProduct[]
  userCards: UserCard[]
  initialProductId?: string
  onClose: () => void
}

type Scope = 'all' | 'custom'

export default function ShareCollectionModal({
  userId,
  locale,
  products,
  userCards,
  initialProductId,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [scope, setScope] = useState<Scope>(initialProductId ? 'custom' : 'all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialProductId ? [initialProductId] : [])
  )
  const [copied, setCopied] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  // Only albums the user actually owns cards from
  const ownedProductIds = useMemo(() => {
    return new Set(userCards.map(c => c.product_id))
  }, [userCards])

  const ownedProducts = useMemo(() => {
    return products
      .filter(p => ownedProductIds.has(p.product_id))
      .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
  }, [products, ownedProductIds])

  const cardCountByProduct = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of userCards) m.set(c.product_id, (m.get(c.product_id) || 0) + 1)
    return m
  }, [userCards])

  const toggleProduct = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    // next-intl 'as-needed': default locale (ja) has no prefix
    const prefix = locale === 'ja' ? '' : `/${locale}`
    const base = `${window.location.origin}${prefix}/share/${userId}`
    if (scope === 'all' || selectedIds.size === 0) return base
    const ids = Array.from(selectedIds).join(',')
    return `${base}?albums=${ids}`
  }, [userId, locale, scope, selectedIds])

  const offerSeekStats = useMemo(() => {
    // Client-side preview: approximate counts (without oshi data)
    // Just shows user_cards filtered by scope
    const scopeIds = scope === 'all'
      ? ownedProductIds
      : selectedIds
    let offer = 0, seek = 0
    for (const c of userCards) {
      if (!scopeIds.has(c.product_id)) continue
      const w = c.wanted_count
      if (w == null) continue
      if (c.quantity - w > 0) offer++
      else if (w - c.quantity > 0) seek++
    }
    return { offer, seek }
  }, [userCards, scope, selectedIds, ownedProductIds])

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // noop
    }
  }

  const tweetUrl = useMemo(() => {
    if (!shareUrl) return '#'
    // X 公式 intent (日本語ハッシュタグは text 内に埋める、hashtags param は欧文前提)
    const text = `【SEVENTEEN トレカ交換】
DMください🙏

#SEVENTEEN #セブチ #トレカ交換 #Connects`
    const params = new URLSearchParams({
      text,
      url: shareUrl,
    })
    return `https://x.com/intent/post?${params.toString()}`
  }, [shareUrl])

  const canShare = scope === 'all' || selectedIds.size > 0

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', zIndex: 70 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl overflow-hidden flex flex-col"
        style={{ background: '#F8F9FA', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>

        <div className="px-4 pb-2 flex-shrink-0">
          <h2 className="text-base font-black" style={{ color: '#1C1C1E' }}>トレカ交換をシェア</h2>
          <p className="text-[11px] mt-0.5" style={{ color: '#8E8E93' }}>
            譲・求リストをURL / Xで共有します
          </p>
        </div>

        <div className="overflow-y-auto px-4 flex-1">
          {/* Scope toggle */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setScope('all')}
              className="py-2.5 rounded-xl text-xs font-bold"
              style={{
                background: scope === 'all' ? '#F3B4E3' : '#FFFFFF',
                color: scope === 'all' ? '#FFFFFF' : '#636366',
                border: scope === 'all' ? 'none' : '1px solid #E5E5EA',
              }}
            >
              全アルバム
            </button>
            <button
              onClick={() => setScope('custom')}
              className="py-2.5 rounded-xl text-xs font-bold"
              style={{
                background: scope === 'custom' ? '#F3B4E3' : '#FFFFFF',
                color: scope === 'custom' ? '#FFFFFF' : '#636366',
                border: scope === 'custom' ? 'none' : '1px solid #E5E5EA',
              }}
            >
              アルバム選択
            </button>
          </div>

          {scope === 'custom' && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold" style={{ color: '#636366' }}>
                  アルバムを選択 ({selectedIds.size})
                </span>
                <button
                  onClick={() => {
                    if (selectedIds.size === ownedProducts.length) setSelectedIds(new Set())
                    else setSelectedIds(new Set(ownedProducts.map(p => p.product_id)))
                  }}
                  className="text-[10px] font-bold"
                  style={{ color: '#F3B4E3' }}
                >
                  {selectedIds.size === ownedProducts.length ? 'クリア' : '全選択'}
                </button>
              </div>
              <div className="space-y-1.5">
                {ownedProducts.map(p => {
                  const checked = selectedIds.has(p.product_id)
                  const count = cardCountByProduct.get(p.product_id) || 0
                  return (
                    <button
                      key={p.product_id}
                      onClick={() => toggleProduct(p.product_id)}
                      className="w-full flex items-center gap-2 p-2 rounded-xl"
                      style={{
                        background: checked ? 'rgba(243,180,227,0.15)' : '#FFFFFF',
                        border: checked ? '1px solid #F3B4E3' : '1px solid #E5E5EA',
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{
                          background: checked ? '#F3B4E3' : 'transparent',
                          border: checked ? 'none' : '1.5px solid #C7C7CC',
                        }}
                      >
                        {checked && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      {p.image_url && (
                        <div
                          className="w-8 h-8 rounded-md flex-shrink-0"
                          style={{ background: `url(${p.image_url}) center/cover` }}
                        />
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-xs font-bold truncate" style={{ color: '#1C1C1E' }}>
                          {p.product_name}
                        </div>
                        <div className="text-[10px]" style={{ color: '#8E8E93' }}>
                          登録 {count}枚
                        </div>
                      </div>
                    </button>
                  )
                })}
                {ownedProducts.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: '#8E8E93' }}>
                    登録済みのアルバムがありません
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preview stats */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div
              className="rounded-xl px-3 py-2 flex items-center justify-between"
              style={{ background: 'rgba(243,180,227,0.12)' }}
            >
              <span className="text-[10px] font-bold" style={{ color: '#636366' }}>譲 (設定済)</span>
              <span className="text-sm font-black" style={{ color: '#F3B4E3' }}>{offerSeekStats.offer}</span>
            </div>
            <div
              className="rounded-xl px-3 py-2 flex items-center justify-between"
              style={{ background: 'rgba(96,165,250,0.12)' }}
            >
              <span className="text-[10px] font-bold" style={{ color: '#636366' }}>求 (設定済)</span>
              <span className="text-sm font-black" style={{ color: '#60A5FA' }}>{offerSeekStats.seek}</span>
            </div>
          </div>
          <p className="text-[9px] mt-1" style={{ color: '#8E8E93' }}>
            ※ 推しメンバーのカードは「欲しい枚数」未設定の場合、自動で1枚欲しいと判定されます
          </p>

          {/* URL preview */}
          {shareUrl && canShare && (
            <div className="mt-3 p-2 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E5E5EA' }}>
              <p className="text-[9px] font-bold mb-0.5" style={{ color: '#8E8E93' }}>共有URL</p>
              <p className="text-[10px] break-all" style={{ color: '#636366' }}>{shareUrl}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex gap-2 px-4 pt-3 flex-shrink-0"
          style={{
            background: '#F8F9FA',
            borderTop: '1px solid #E5E5EA',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl text-sm font-bold"
            style={{ background: '#E5E5EA', color: '#636366' }}
          >
            閉じる
          </button>
          <button
            onClick={handleCopy}
            disabled={!canShare}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
            style={{
              background: '#FFFFFF',
              color: '#1C1C1E',
              border: '1px solid #E5E5EA',
              opacity: canShare ? 1 : 0.4,
            }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ color: '#22C55E' }}>コピー済</span>
              </>
            ) : (
              <>URL</>
            )}
          </button>
          {/* X に投稿ボタンは一旦非表示 (運用判断で後日復活予定) */}
          {false && (
            <a
              href={canShare ? tweetUrl : '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => { if (!canShare) e.preventDefault() }}
              className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
              style={{
                background: '#1C1C1E',
                color: '#FFFFFF',
                opacity: canShare ? 1 : 0.4,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Xに投稿
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
