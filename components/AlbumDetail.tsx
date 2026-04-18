'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useCardVersions, useCardMaster, type CardProduct, type CardMaster, type UserCard, productTypeLabels } from '@/lib/useCardData'
import { seventeenMembers } from '@/lib/config/constants'

interface AlbumDetailProps {
  product: CardProduct
  userCards: UserCard[]
  onBack: () => void
  onCardTap: (card: CardMaster, owned: UserCard | null) => void
}

// member_id to display color
const memberColorMap = new Map(
  seventeenMembers.map((m, i) => [`A${String(i + 1).padStart(6, '0')}`, m.color])
)

function formatDate(d: string | null) {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

export default function AlbumDetail({ product, userCards, onBack, onCardTap }: AlbumDetailProps) {
  const t = useTranslations('Goods')
  const { versions, loading: versionsLoading } = useCardVersions(product.product_id)
  const { cards, loading: cardsLoading } = useCardMaster(product.product_id)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)

  // Build owned set: card_master_id -> UserCard
  const ownedMap = useMemo(() => {
    const m = new Map<string, UserCard>()
    for (const uc of userCards) {
      if (uc.card_master_id && uc.product_id === product.product_id) {
        m.set(uc.card_master_id, uc)
      }
    }
    return m
  }, [userCards, product.product_id])

  // Filter cards by selected version
  const activeVersionId = selectedVersionId ?? versions[0]?.version_id ?? null
  const filteredCards = useMemo(() => {
    if (!activeVersionId) return cards
    return cards.filter(c => c.version_id === activeVersionId)
  }, [cards, activeVersionId])

  // Group by member
  const grouped = useMemo(() => {
    const map = new Map<string, CardMaster[]>()
    for (const c of filteredCards) {
      const key = c.member_name || 'GROUP'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    return map
  }, [filteredCards])

  // Progress
  const totalInVersion = filteredCards.length
  const ownedInVersion = filteredCards.filter(c => ownedMap.has(c.id)).length
  const totalAll = cards.length
  const ownedAll = cards.filter(c => ownedMap.has(c.id)).length
  const progressPct = totalInVersion > 0 ? Math.round((ownedInVersion / totalInVersion) * 100) : 0

  const loading = versionsLoading || cardsLoading

  return (
    <div>
      {/* Header */}
      <div className="px-4 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold mb-3"
          style={{ color: '#F3B4E3' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('backToList')}
        </button>

        {/* Album info */}
        <div className="flex gap-3">
          <div
            className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{
              background: product.image_url
                ? `url(${product.image_url}) center/cover`
                : 'linear-gradient(135deg, rgba(243,180,227,0.15) 0%, rgba(167,139,250,0.12) 100%)',
            }}
          >
            {!product.image_url && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black truncate" style={{ color: '#1C1C1E' }}>{product.product_name}</h2>
            <p className="text-[11px] mt-0.5" style={{ color: '#8E8E93' }}>
              {formatDate(product.release_date)} / {productTypeLabels[product.product_type] || product.product_type}
            </p>
            {/* Overall progress */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E5EA' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${totalAll > 0 ? (ownedAll / totalAll) * 100 : 0}%`,
                    background: '#F3B4E3',
                  }}
                />
              </div>
              <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#636366' }}>
                {ownedAll}/{totalAll}
              </span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F3B4E3', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <>
          {/* Version tabs */}
          {versions.length > 1 && (
            <div className="px-4 pb-3 overflow-x-auto">
              <div className="flex gap-1.5" style={{ minWidth: 'max-content' }}>
                {versions.map(v => {
                  const isActive = v.version_id === activeVersionId
                  return (
                    <button
                      key={v.version_id}
                      onClick={() => setSelectedVersionId(v.version_id)}
                      className="py-1.5 px-3 rounded-full text-[11px] font-bold transition-all whitespace-nowrap"
                      style={{
                        background: isActive ? '#1C1C1E' : 'rgba(28,28,30,0.06)',
                        color: isActive ? '#FFFFFF' : '#636366',
                      }}
                    >
                      {v.version_name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Version progress */}
          {versions.length > 1 && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold" style={{ color: '#8E8E93' }}>
                  {t('versionProgress')}:
                </span>
                <span className="text-[10px] font-bold" style={{ color: '#F3B4E3' }}>
                  {ownedInVersion}/{totalInVersion} ({progressPct}%)
                </span>
              </div>
            </div>
          )}

          {/* Card grid by member */}
          <div className="px-4 space-y-4 pb-6">
            {Array.from(grouped.entries()).map(([memberName, memberCards]) => {
              const memberId = memberCards[0]?.member_id || ''
              const memberColor = memberColorMap.get(memberId) || '#636366'

              return (
                <div key={memberName}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-1.5 h-4 rounded-full"
                      style={{ background: memberColor }}
                    />
                    <span className="text-xs font-bold" style={{ color: '#1C1C1E' }}>{memberName}</span>
                    <span className="text-[10px]" style={{ color: '#8E8E93' }}>
                      {memberCards.filter(c => ownedMap.has(c.id)).length}/{memberCards.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {memberCards.map(card => {
                      const owned = ownedMap.get(card.id) || null
                      const hasImage = !!card.front_image_url

                      return (
                        <button
                          key={card.id}
                          onClick={() => onCardTap(card, owned)}
                          className="relative aspect-[2/3] rounded-lg overflow-hidden transition-transform active:scale-95"
                          style={{
                            background: owned
                              ? (hasImage ? `url(${card.front_image_url}) center/cover` : 'rgba(243,180,227,0.15)')
                              : '#E5E5EA',
                            border: owned ? `2px solid ${memberColor}` : '2px solid transparent',
                          }}
                        >
                          {/* Card content */}
                          {!hasImage && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                              <svg
                                width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke={owned ? memberColor : '#C7C7CC'} strokeWidth="1.5"
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                              <span
                                className="text-[8px] mt-1 font-semibold text-center leading-tight"
                                style={{ color: owned ? '#636366' : '#C7C7CC' }}
                              >
                                {card.card_detail || card.card_type}
                              </span>
                            </div>
                          )}
                          {/* Greyed overlay for unowned */}
                          {!owned && hasImage && (
                            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
                          )}
                          {/* Quantity badge */}
                          {owned && owned.quantity > 1 && (
                            <div
                              className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                              style={{ background: '#F3B4E3', color: '#FFFFFF' }}
                            >
                              {owned.quantity}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: '#8E8E93' }}>{t('noCards')}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
