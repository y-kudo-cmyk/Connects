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

interface MemberEntry {
  memberId: string
  name: string
  color: string
  index: number
}

const memberOrder: MemberEntry[] = seventeenMembers.map((m, i) => ({
  memberId: `A${String(i + 1).padStart(6, '0')}`,
  name: m.name,
  color: m.color,
  index: i,
}))

const memberColorMap = new Map(memberOrder.map(m => [m.memberId, m.color]))

function formatDate(d: string | null) {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

export default function AlbumDetail({ product, userCards, onBack, onCardTap }: AlbumDetailProps) {
  const t = useTranslations('Goods')
  const { versions, loading: versionsLoading } = useCardVersions(product.product_id)
  const { cards, loading: cardsLoading } = useCardMaster(product.product_id)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const ownedMap = useMemo(() => {
    const m = new Map<string, UserCard>()
    for (const uc of userCards) {
      if (uc.card_master_id && uc.product_id === product.product_id) {
        m.set(uc.card_master_id, uc)
      }
    }
    return m
  }, [userCards, product.product_id])

  const versionNameMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const v of versions) m.set(v.version_id, v.version_name)
    return m
  }, [versions])

  const availableMembers = useMemo(() => {
    const present = new Set<string>()
    for (const c of cards) {
      if (c.member_id) present.add(c.member_id)
    }
    return memberOrder.filter(m => present.has(m.memberId))
  }, [cards])

  const activeMemberId = useMemo(() => {
    if (selectedMemberId && availableMembers.some(m => m.memberId === selectedMemberId)) {
      return selectedMemberId
    }
    return availableMembers[0]?.memberId ?? null
  }, [selectedMemberId, availableMembers])

  const activeMember = useMemo(
    () => availableMembers.find(m => m.memberId === activeMemberId) ?? null,
    [availableMembers, activeMemberId]
  )

  const memberCards = useMemo(() => {
    if (!activeMemberId) return []
    return cards.filter(c => c.member_id === activeMemberId)
  }, [cards, activeMemberId])

  const groupedByVersion = useMemo(() => {
    const map = new Map<string, CardMaster[]>()
    for (const c of memberCards) {
      const key = c.version_id || ''
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    const ordered = new Map<string, CardMaster[]>()
    for (const v of versions) {
      const bucket = map.get(v.version_id)
      if (bucket && bucket.length > 0) ordered.set(v.version_id, bucket)
    }
    for (const [k, v] of map.entries()) {
      if (!ordered.has(k)) ordered.set(k, v)
    }
    return ordered
  }, [memberCards, versions])

  const totalInMember = memberCards.length
  const ownedInMember = memberCards.filter(c => ownedMap.has(c.id)).length
  const totalAll = cards.length
  const ownedAll = cards.filter(c => ownedMap.has(c.id)).length
  const memberProgressPct = totalInMember > 0 ? Math.round((ownedInMember / totalInMember) * 100) : 0

  const hasFn = (t as unknown as { has?: (key: string) => boolean }).has
  const memberProgressLabel: string = typeof hasFn === 'function' && hasFn('memberProgress')
    ? t('memberProgress')
    : 'Member progress'

  const memberColor = activeMember?.color ?? '#636366'
  const loading = versionsLoading || cardsLoading

  return (
    <div>
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
          {availableMembers.length > 0 && (
            <div className="px-4 pb-3 overflow-x-auto">
              <div className="flex gap-1.5" style={{ minWidth: 'max-content' }}>
                {availableMembers.map(m => {
                  const isActive = m.memberId === activeMemberId
                  return (
                    <button
                      key={m.memberId}
                      onClick={() => setSelectedMemberId(m.memberId)}
                      className="py-1.5 px-3 rounded-full text-[11px] font-bold transition-all whitespace-nowrap"
                      style={{
                        background: isActive ? '#1C1C1E' : 'rgba(28,28,30,0.06)',
                        color: isActive ? '#FFFFFF' : '#636366',
                        boxShadow: isActive ? `0 0 0 2px ${m.color}` : 'none',
                      }}
                    >
                      {m.index + 1}. {m.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {activeMember && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold" style={{ color: '#8E8E93' }}>
                  {memberProgressLabel}:
                </span>
                <span className="text-[10px] font-bold" style={{ color: memberColor }}>
                  {ownedInMember}/{totalInMember} ({memberProgressPct}%)
                </span>
              </div>
            </div>
          )}

          <div className="px-4 space-y-4 pb-6">
            {Array.from(groupedByVersion.entries()).map(([versionId, versionCards]) => {
              const versionName = versionNameMap.get(versionId) || versionId || '—'
              const ownedInVersion = versionCards.filter(c => ownedMap.has(c.id)).length

              return (
                <div key={versionId || 'no-version'}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-1.5 h-4 rounded-full"
                      style={{ background: memberColor }}
                    />
                    <h3 className="text-xs font-bold" style={{ color: '#1C1C1E' }}>{versionName}</h3>
                    <span className="text-[10px]" style={{ color: '#8E8E93' }}>
                      {ownedInVersion}/{versionCards.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {versionCards.map(card => {
                      const owned = ownedMap.get(card.id) || null
                      const displayImage = owned?.front_image_url || card.front_image_url || ''
                      const hasImage = !!displayImage
                      const accent = memberColorMap.get(card.member_id) || memberColor

                      return (
                        <button
                          key={card.id}
                          onClick={() => onCardTap(card, owned)}
                          className="relative aspect-[2/3] rounded-lg overflow-hidden transition-transform active:scale-95"
                          style={{
                            background: owned
                              ? (hasImage ? `url(${displayImage}) center/cover` : 'rgba(243,180,227,0.15)')
                              : '#E5E5EA',
                            border: owned ? `2px solid ${accent}` : '2px solid transparent',
                          }}
                        >
                          {!hasImage && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5">
                              <svg
                                width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke={owned ? accent : '#8E8E93'} strokeWidth="1.5"
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                              <span
                                className="text-[11px] mt-1.5 font-bold text-center leading-tight"
                                style={{ color: owned ? '#1C1C1E' : '#636366' }}
                              >
                                {card.card_detail || card.card_type}
                              </span>
                            </div>
                          )}
                          {!owned && hasImage && (
                            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
                          )}
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

          {memberCards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: '#8E8E93' }}>{t('noCards')}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
