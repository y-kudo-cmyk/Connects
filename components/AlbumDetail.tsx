'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useCardVersions, useCardMaster, type CardProduct, type CardMaster, type UserCard, productTypeLabels } from '@/lib/useCardData'
import { seventeenMembers } from '@/lib/config/constants'
import { createClient } from '@/lib/supabase/client'

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
  const [favMemberIds, setFavMemberIds] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data, error } = await supabase
          .from('profiles')
          .select('fav_member_ids')
          .eq('id', user.id)
          .single()
        if (error || cancelled) return
        const ids = (data?.fav_member_ids as string[] | null) ?? []
        setFavMemberIds(Array.isArray(ids) ? ids : [])
      } catch {
        // treat as empty
      }
    }
    void run()
    return () => { cancelled = true }
  }, [])

  const favSet = useMemo(() => new Set(favMemberIds), [favMemberIds])

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

  const sortedMembers = useMemo(() => {
    const oshi = availableMembers.filter(m => favSet.has(m.memberId))
    const rest = availableMembers.filter(m => !favSet.has(m.memberId))
    return [...oshi, ...rest]
  }, [availableMembers, favSet])

  const activeMemberId = useMemo(() => {
    if (selectedMemberId && availableMembers.some(m => m.memberId === selectedMemberId)) {
      return selectedMemberId
    }
    const firstOshi = availableMembers.find(m => favSet.has(m.memberId))
    if (firstOshi) return firstOshi.memberId
    return availableMembers[0]?.memberId ?? null
  }, [selectedMemberId, availableMembers, favSet])

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

  // Further group versions by tier → base name (before " - " separator)
  // e.g. tier=STORE_JP, "BLUE/ECHO - Weverse Shop" → base "BLUE/ECHO", store "Weverse Shop"
  // Fallback: infer tier from version_id prefix if DB tier column is absent
  function inferTier(versionId: string): string {
    if (/_LUCKY_/i.test(versionId)) return 'LUCKY_DRAW'
    if (/_BEN_|_BENEFIT_/i.test(versionId)) return 'STORE_JP'
    if (/_EVENT_/i.test(versionId)) return 'EVENT'
    if (/_VENUE_/i.test(versionId)) return 'VENUE'
    if (/_MERCH_/i.test(versionId)) return 'MERCH_BONUS'
    return 'INCLUDED'
  }

  const versionTierMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const v of versions) m.set(v.version_id, v.tier || inferTier(v.version_id))
    return m
  }, [versions])

  const STORE_TIERS = new Set(['STORE_JP', 'STORE_KR'])

  // For STORE tiers: pivot to store-first (Weverse → [BLUE/ECHO, COMPACT])
  // For other tiers: base-first (same as before)
  const groupedByTierAndBase = useMemo(() => {
    const tiers = new Map<string, Map<string, { store: string; versionId: string; cards: CardMaster[] }[]>>()
    for (const [versionId, cards] of groupedByVersion.entries()) {
      const tier = versionTierMap.get(versionId) || 'INCLUDED'
      const fullName = versionNameMap.get(versionId) || versionId
      const sepIdx = fullName.indexOf(' - ')
      const base = sepIdx >= 0 ? fullName.slice(0, sepIdx) : fullName
      const store = sepIdx >= 0 ? fullName.slice(sepIdx + 3) : ''
      if (!tiers.has(tier)) tiers.set(tier, new Map())
      const tierMap = tiers.get(tier)!
      if (STORE_TIERS.has(tier) && store) {
        // store-first pivot
        if (!tierMap.has(store)) tierMap.set(store, [])
        tierMap.get(store)!.push({ store: base, versionId, cards })
      } else {
        if (!tierMap.has(base)) tierMap.set(base, [])
        tierMap.get(base)!.push({ store, versionId, cards })
      }
    }
    return tiers
  }, [groupedByVersion, versionNameMap, versionTierMap])

  const TIER_ORDER = ['INCLUDED', 'STORE_JP', 'STORE_KR', 'LUCKY_DRAW', 'EVENT', 'VENUE', 'MERCH_BONUS']
  const TIER_META: Record<string, { icon: string; label: string; bg: string }> = {
    INCLUDED:    { icon: '📀', label: '封入トレカ',       bg: 'rgba(59,130,246,0.06)' },
    STORE_JP:    { icon: '🇯🇵', label: '店舗特典(日本)',  bg: 'rgba(248,113,113,0.06)' },
    STORE_KR:    { icon: '🇰🇷', label: '店舗特典(韓国)',  bg: 'rgba(236,72,153,0.06)' },
    LUCKY_DRAW:  { icon: '🎲', label: 'ラッキードロー',    bg: 'rgba(251,146,60,0.06)' },
    EVENT:       { icon: '🎫', label: 'イベント当選',      bg: 'rgba(167,139,250,0.06)' },
    VENUE:       { icon: '🏟',  label: '会場限定',          bg: 'rgba(52,211,153,0.06)' },
    MERCH_BONUS: { icon: '🛒', label: 'MERCH付属',         bg: 'rgba(139,92,246,0.06)' },
  }

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
          {sortedMembers.length > 0 && (
            <div className="px-4 pb-3 overflow-x-auto">
              <div className="flex gap-1.5" style={{ minWidth: 'max-content' }}>
                {sortedMembers.map(m => {
                  const isActive = m.memberId === activeMemberId
                  const isOshi = favSet.has(m.memberId)
                  const boxShadow = isActive
                    ? (isOshi ? `0 0 0 3px ${m.color}` : `0 0 0 2px ${m.color}`)
                    : (isOshi ? `0 0 0 1.5px ${m.color}` : 'none')
                  return (
                    <button
                      key={m.memberId}
                      onClick={() => setSelectedMemberId(m.memberId)}
                      className="py-1.5 px-3 rounded-full text-[11px] font-bold transition-all whitespace-nowrap"
                      style={{
                        background: isActive ? '#1C1C1E' : 'rgba(28,28,30,0.06)',
                        color: isActive ? '#FFFFFF' : '#636366',
                        boxShadow,
                      }}
                    >
                      {isOshi ? '\u2605 ' : ''}{m.index + 1}. {m.name}
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

          <div className="px-4 space-y-6 pb-6">
            {TIER_ORDER.filter(t => groupedByTierAndBase.has(t)).map(tier => {
              const tierMap = groupedByTierAndBase.get(tier)!
              const meta = TIER_META[tier] || { icon: '📌', label: tier, bg: '#F0F0F5' }
              // Tier total
              let tierOwned = 0, tierTotal = 0
              for (const subs of tierMap.values()) for (const s of subs) { tierOwned += s.cards.filter(c => ownedMap.has(c.id)).length; tierTotal += s.cards.length }

              return (
                <section key={tier} className="rounded-xl px-3 py-3" style={{ background: meta.bg }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{meta.icon}</span>
                    <h2 className="text-sm font-black" style={{ color: '#1C1C1E' }}>{meta.label}</h2>
                    <span className="text-[10px] font-bold ml-auto" style={{ color: '#636366' }}>
                      {tierOwned}/{tierTotal}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {Array.from(tierMap.entries()).map(([base, subs]) => {
                      const totalOwned = subs.reduce((acc, s) => acc + s.cards.filter(c => ownedMap.has(c.id)).length, 0)
                      const totalCards = subs.reduce((acc, s) => acc + s.cards.length, 0)
                      return (
                <div key={base || 'no-base'}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-1 h-3.5 rounded-full"
                      style={{ background: memberColor }}
                    />
                    <h3 className="text-xs font-bold" style={{ color: '#1C1C1E' }}>{base || '—'}</h3>
                    <span className="text-[10px]" style={{ color: '#8E8E93' }}>
                      {totalOwned}/{totalCards}
                    </span>
                  </div>
                  {subs.map(({ store, versionId, cards: versionCards }) => {
                    const ownedInVersion = versionCards.filter(c => ownedMap.has(c.id)).length
                    return (
                      <div key={versionId} className="mb-3">
                        {store && (
                          <div className="flex items-center gap-2 mb-1.5 pl-2.5">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(28,28,30,0.06)', color: '#636366' }}
                            >
                              {store}
                            </span>
                            <span className="text-[9px]" style={{ color: '#8E8E93' }}>
                              {ownedInVersion}/{versionCards.length}
                            </span>
                          </div>
                        )}
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
              )
            })}
                  </div>
                </section>
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
