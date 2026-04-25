'use client'

import { useState, useMemo, useEffect, Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { useCardVersions, useCardMaster, type CardProduct, type CardMaster, type UserCard, productTypeLabels, HIDE_DATE_TYPES, getCardAspect, isTradingCardFit, getCardImageFit, getCardColSpan, hasBackSide, cleanCardDetail, shouldShowTypeLabel, cardTypeLabels } from '@/lib/useCardData'
import { seventeenMembers, getUnitLeaderForMember, isUnitSharedCard, getAgeLineLeaderForMember, isAgeLineSharedCard, getGroupShotMembersForCardDetail } from '@/lib/config/constants'
import { createClient } from '@/lib/supabase/client'

// Tailwind JIT 用の static map (col-span-1〜6 をビルドに含める)
const SPAN_CLASS_MAP: Record<number, string> = {
  1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3',
  4: 'col-span-4', 5: 'col-span-5', 6: 'col-span-6',
}

interface AlbumDetailProps {
  product: CardProduct
  userCards: UserCard[]
  onBack: () => void
  onCardTap: (card: CardMaster, owned: UserCard | null) => void
  onBackTileTap?: (card: CardMaster, owned: UserCard | null) => void
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

export default function AlbumDetail({ product, userCards, onBack, onCardTap, onBackTileTap }: AlbumDetailProps) {
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
  // 推し順位 (0=1番推し, 1=2番推し...) 未指定は Infinity (並びで後ろ)
  const favRankMap = useMemo(() => {
    const m = new Map<string, number>()
    favMemberIds.forEach((id, i) => m.set(id, i))
    return m
  }, [favMemberIds])

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
    // 推しは favMemberIds の順 (1番推し→2番推し→…)、その後デフォルト並び
    const oshi = availableMembers
      .filter(m => favSet.has(m.memberId))
      .sort((a, b) => (favRankMap.get(a.memberId) ?? 0) - (favRankMap.get(b.memberId) ?? 0))
    const rest = availableMembers.filter(m => !favSet.has(m.memberId))
    return [...oshi, ...rest]
  }, [availableMembers, favSet, favRankMap])

  const activeMemberId = useMemo(() => {
    if (selectedMemberId && availableMembers.some(m => m.memberId === selectedMemberId)) {
      return selectedMemberId
    }
    // デフォルト選択は 1番推し (availableMembers にいればそれ)
    for (const id of favMemberIds) {
      if (availableMembers.some(m => m.memberId === id)) return id
    }
    return availableMembers[0]?.memberId ?? null
  }, [selectedMemberId, availableMembers, favMemberIds])

  const activeMember = useMemo(
    () => availableMembers.find(m => m.memberId === activeMemberId) ?? null,
    [availableMembers, activeMemberId]
  )

  const memberCards = useMemo(() => {
    if (!activeMemberId) return []
    // そのメンバーのカード + ユニット/年齢ライン共通カード (代表 member_id で格納) を含める
    const unitLeader = getUnitLeaderForMember(activeMemberId)
    const ageLeader = getAgeLineLeaderForMember(activeMemberId)
    return cards.filter(c => {
      if (c.member_id === activeMemberId) return true
      // ユニット共通カード: 代表 (リーダー) member_id に保存されているので、
      // 同ユニット内の他メンバーにも表示
      if (unitLeader && c.member_id === unitLeader && isUnitSharedCard(c.card_detail)) return true
      // 年齢ライン共通カード: 同ラインの代表 member_id に保存
      if (ageLeader && c.member_id === ageLeader && isAgeLineSharedCard(c.card_detail)) return true
      // card_detail 内に [A000001,A000002,...] 形式で member_id が記載されたカード (優先)
      const inlineMatch = (c.card_detail || '').match(/\[([A-Z0-9,]+)\]/)
      if (inlineMatch) {
        const ids = inlineMatch[1].split(',').map(x => x.trim())
        if (ids.includes(activeMemberId)) return true
        // inline match がある場合はそれ以外のメンバーには表示しない (個別指定優先)
        // ただし他のルール (member_id 一致 / unitLeader / ageLeader) は上で判定済
      }
      // 集合写真 N (inline 指定がない場合、card_detail "集合 1"等 で global default 判定)
      const groupShotMembers = !inlineMatch ? getGroupShotMembersForCardDetail(c.card_detail) : null
      if (groupShotMembers && groupShotMembers.has(activeMemberId)) return true
      // 番号無し「集合」「団体」明示の null member_id カードは全タブから表示
      if (!c.member_id) {
        const d = (c.card_detail || '').trim()
        // 番号付き「集合 N」「団体 N」は上の処理で判定済 (該当メンバーのみ表示)
        if ((d.includes('集合') || d.includes('団体')) && !groupShotMembers) return true
        // 未紐付けユニットカード (placeholder) — 全タブに見せて後でメンバー紐付け可能に
        // ※ inlineMatch ([A000xxx,...]) で紐付け済の場合は上の処理で判定済
        if (d.includes('ユニット') && !inlineMatch) return true
      }
      return false
    })
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

  // 店舗表示順: Weverse → UMS → HMV → Tower → TSUTAYA → その他
  const STORE_ORDER = ['weverse', 'ums', 'universal', 'hmv', 'tower', 'tsutaya']
  const storeRank = (name: string): number => {
    const n = name.toLowerCase()
    for (let i = 0; i < STORE_ORDER.length; i++) {
      if (n.includes(STORE_ORDER[i])) return i
    }
    return 99
  }

  // 店舗名をセクションヘッダ用に短縮（長い表記だけ短く）
  const shortStoreName = (name: string): string => {
    const n = name.toLowerCase()
    if (n.includes('universal')) return 'UMS'
    if (n.includes('weverse')) return 'Weverse'
    if (n.includes('hmv')) return 'HMV'
    if (n.includes('tower')) return 'TOWER RECORDS'
    if (n.includes('tsutaya')) return 'TSUTAYA'
    return name
  }

  // STORE tier: store-first pivot (Weverse → [通常版, DAREDEVIL版]) で base同士を横並び
  // 他のtier: base-first
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
        // store-first: key=店舗, 各要素のstore=baseに入替（UIでsub headerに表示する値）
        if (!tierMap.has(store)) tierMap.set(store, [])
        tierMap.get(store)!.push({ store: base, versionId, cards })
      } else {
        if (!tierMap.has(base)) tierMap.set(base, [])
        tierMap.get(base)!.push({ store, versionId, cards })
      }
    }
    // STORE tier: 店舗キーを表示順にソート
    for (const [tier, tierMap] of tiers.entries()) {
      if (STORE_TIERS.has(tier)) {
        const sorted = new Map(
          Array.from(tierMap.entries()).sort((a, b) => storeRank(a[0]) - storeRank(b[0]))
        )
        tiers.set(tier, sorted)
      }
    }
    return tiers
  }, [groupedByVersion, versionNameMap, versionTierMap])

  const TIER_ORDER = ['INCLUDED', 'STORE_JP', 'STORE_KR', 'LUCKY_DRAW', 'EVENT', 'TOUR', 'VENUE', 'MERCH_BONUS']
  const TIER_META: Record<string, { icon: string; label: string; bg: string }> = {
    INCLUDED:    { icon: '📀', label: '封入',           bg: 'rgba(59,130,246,0.06)' },
    STORE_JP:    { icon: '🇯🇵', label: '店舗特典(日本)',  bg: 'rgba(248,113,113,0.06)' },
    STORE_KR:    { icon: '🇰🇷', label: '店舗特典(韓国)',  bg: 'rgba(236,72,153,0.06)' },
    LUCKY_DRAW:  { icon: '🎲', label: 'ラッキードロー',    bg: 'rgba(251,146,60,0.06)' },
    EVENT:       { icon: '🎫', label: 'イベント当選',      bg: 'rgba(167,139,250,0.06)' },
    TOUR:        { icon: '🎤', label: 'ツアートレカ',      bg: 'rgba(99,102,241,0.06)' },
    VENUE:       { icon: '🏟',  label: '会場限定',          bg: 'rgba(52,211,153,0.06)' },
    MERCH_BONUS: { icon: '🛒', label: 'MERCH付属',         bg: 'rgba(139,92,246,0.06)' },
  }

  // "Owned" only counts rows with quantity > 0 (qty=0 means "want but don't have")
  const isActuallyOwned = (id: string) => (ownedMap.get(id)?.quantity ?? 0) > 0
  const totalInMember = memberCards.length
  const ownedInMember = memberCards.filter(c => isActuallyOwned(c.id)).length
  const totalAll = cards.length
  const ownedAll = cards.filter(c => isActuallyOwned(c.id)).length
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
              {HIDE_DATE_TYPES.has(product.product_type)
                ? (productTypeLabels[product.product_type] || product.product_type)
                : `${formatDate(product.release_date)} / ${productTypeLabels[product.product_type] || product.product_type}`}
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
              for (const subs of tierMap.values()) for (const s of subs) { tierOwned += s.cards.filter(c => isActuallyOwned(c.id)).length; tierTotal += s.cards.length }

              return (
                <section key={tier} className="rounded-xl px-3 py-3" style={{ background: meta.bg }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{meta.icon}</span>
                    <h2 className="text-sm font-black" style={{ color: '#1C1C1E' }}>{meta.label}</h2>
                    <span className="text-[10px] font-bold ml-auto" style={{ color: '#636366' }}>
                      {tierOwned}/{tierTotal}
                    </span>
                  </div>

                  {(() => {
                    // 枠サイズは全VER統一 (full幅 + grid-cols-4 固定)。
                    // B+C の sub結合は renderBaseBlock 内の groupSubsToParagraphs で行う。
                    const entries = Array.from(tierMap.entries())
                    return (
                      <div className="space-y-4">
                        {entries.map(([base, subs]) => renderBaseBlock(base, subs, tier, false))}
                      </div>
                    )
                  })()}
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

  // 8-col baseline: 各sub の占有列数を合算し、段落≤8列で貪欲パック。
  // 裏タイルは必要なら col-span-2 (photocard同等) を追加。
  function subCols(sub: { cards: CardMaster[] }) {
    const hasBack = sub.cards.some(c => hasBackSide(c.card_type))
    const cardsCols = sub.cards.reduce((n, c) => n + getCardColSpan(c.card_type), 0)
    return (hasBack ? 2 : 0) + cardsCols
  }
  function groupSubsToParagraphs(subs: { store: string; versionId: string; cards: CardMaster[] }[]) {
    // VER が違っても横に並べられるなら同じ段落にまとめ、はみ出したら CSS grid 任せで自動改行
    return subs.length > 0 ? [subs] : []
  }

  function renderBaseBlock(base: string, subs: { store: string; versionId: string; cards: CardMaster[] }[], tier: string, compact = false) {
    const isStore = STORE_TIERS.has(tier)
    const totalOwned = subs.reduce((acc, s) => acc + s.cards.filter(c => isActuallyOwned(c.id)).length, 0)
    const totalCards = subs.reduce((acc, s) => acc + s.cards.length, 0)
    const displayBase = isStore ? shortStoreName(base) : base

    const paragraphs = groupSubsToParagraphs(subs)

    return (
                <div key={base || 'no-base'}>
                  <div className="flex items-center gap-2 mb-2" style={{ minHeight: 20 }}>
                    <div
                      className="w-1 h-3.5 rounded-full flex-shrink-0"
                      style={{ background: memberColor }}
                    />
                    <h3 className="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: '#1C1C1E' }}>{displayBase || '—'}</h3>
                    <span className="text-[10px] whitespace-nowrap flex-shrink-0" style={{ color: '#8E8E93' }}>
                      {totalOwned}/{totalCards}
                    </span>
                  </div>
                  <div>
                  {paragraphs.map((paraSubs, pi) => {
                    const showSubBadge = paraSubs.length > 1 || (paraSubs[0]?.store && paraSubs[0].store !== '通常')
                    return (
                      <div key={pi} className="mb-3">
                        {showSubBadge && (
                          <div className="flex items-center gap-2 flex-wrap mb-1.5 pl-2.5" style={{ minHeight: 22 }}>
                            {paraSubs.map(({ store, versionId, cards: vcs }) => {
                              const ownedInVersion = vcs.filter(c => isActuallyOwned(c.id)).length
                              const label = store || (versionNameMap.get(versionId) ?? '')
                              return (
                                <span key={versionId} className="flex items-center gap-1">
                                  {label && label !== '通常' && (
                                    <span
                                      className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                                      style={{ background: 'rgba(28,28,30,0.06)', color: '#636366' }}
                                    >
                                      {label}
                                    </span>
                                  )}
                                  <span className="text-[9px] whitespace-nowrap" style={{ color: '#8E8E93' }}>
                                    {ownedInVersion}/{vcs.length}
                                  </span>
                                </span>
                              )
                            })}
                          </div>
                        )}
                        {!showSubBadge && <div className="mb-1.5" style={{ minHeight: 22 }} />}
                        <div className="grid grid-cols-8 gap-2">
                          {paraSubs.flatMap(sub => {
                            // 裏面不要なタイプ (magnet_sheet/mega_jacket) は裏タイル省略
                            const subHasBack = sub.cards.some(c => hasBackSide(c.card_type))
                            // 1 shared back thumb per sub (if any back image exists in this sub)
                            const subBack = sub.cards
                              .map(c => ownedMap.get(c.id)?.back_image_url || c.back_image_url)
                              .find(u => !!u) || ''
                            // 裏面タイルのサイズ/比率は表面カードと同じにする
                            const backRefCard = sub.cards[0]
                            const backCardType = backRefCard?.card_type || 'photocard'
                            const backColSpan = getCardColSpan(backCardType)
                            const backSpanClass = SPAN_CLASS_MAP[backColSpan] || 'col-span-2'
                            const backIsTrading = isTradingCardFit(backCardType)
                            const backAspect = getCardAspect(backCardType)
                            const backImgFit = getCardImageFit(backCardType)
                            const backTile = subHasBack ? (
                              <button
                                key={`${sub.versionId}-back`}
                                title="裏面画像を登録"
                                onClick={() => {
                                  if (!onBackTileTap) return
                                  const rep = sub.cards.find(c => ownedMap.get(c.id)) || sub.cards[0]
                                  onBackTileTap(rep, ownedMap.get(rep.id) || null)
                                }}
                                className={`relative rounded-lg overflow-hidden transition-transform active:scale-95 block self-start ${backSpanClass}`}
                                style={{
                                  width: '100%',
                                  // 表面と同じ枠ロジック: トレカは固定枠、それ以外は画像に追従
                                  ...(backIsTrading ? { aspectRatio: backAspect } : (subBack ? {} : { aspectRatio: backAspect })),
                                  background: backIsTrading && subBack
                                    ? `rgba(142,142,147,0.08) url(${subBack}) center / ${backImgFit} no-repeat`
                                    : 'rgba(142,142,147,0.08)',
                                  border: '2px dotted #C7C7CC',
                                }}
                              >
                                {/* 非トレカ: img タグで自然アスペクト */}
                                {!backIsTrading && subBack && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={subBack} alt="back" className="block w-full h-auto" loading="lazy" />
                                )}
                                <span
                                  className="absolute left-1 top-1 px-1.5 rounded-full text-[9px] font-bold"
                                  style={{ background: 'rgba(0,0,0,0.55)', color: '#FFFFFF' }}
                                >
                                  裏
                                </span>
                                {!subBack ? (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2">
                                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                    <span className="text-[10px] font-bold" style={{ color: '#636366' }}>裏面を登録</span>
                                  </div>
                                ) : (
                                  <span
                                    className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                                    style={{ background: 'rgba(243,180,227,0.92)', color: '#FFFFFF' }}
                                  >
                                    編集
                                  </span>
                                )}
                              </button>
                            ) : null
                            // 表タイル並び: photocard 系を最優先、次に postcard、最後に folding/paddle 等
                            const TYPE_PRIORITY: Record<string, number> = {
                              photocard: 0, luckydraw: 0, fotocard: 0, minicard: 0,
                              postcard: 1, cd_plate: 1, bookmark: 1,
                              sticker: 2, layer_card: 2,
                              folding_card: 3, paddle: 3, poster: 3, 'tear-off_poster': 3,
                              binder: 4, clear_file: 4,
                            }
                            const isGroupPostcard = (c: typeof sub.cards[number]) =>
                              (c.card_type || '').toLowerCase() === 'postcard'
                              && (c.card_detail === '団体' || c.id.endsWith('_GROUP'))
                            const sortedCards = [...sub.cards].sort((a, b) => {
                              const pa = TYPE_PRIORITY[(a.card_type || '').toLowerCase()] ?? 99
                              const pb = TYPE_PRIORITY[(b.card_type || '').toLowerCase()] ?? 99
                              if (pa !== pb) return pa - pb
                              // 団体ポストカード (横長枠) は postcard 群の最後尾へ並べて行を独立させる
                              const ga = isGroupPostcard(a) ? 1 : 0
                              const gb = isGroupPostcard(b) ? 1 : 0
                              if (ga !== gb) return ga - gb
                              return getCardColSpan(a.card_type) - getCardColSpan(b.card_type)
                            })
                            const frontTiles = sortedCards.map(card => {
                      const owned = ownedMap.get(card.id) || null
                      const hasQty = (owned?.quantity ?? 0) > 0
                      const displayImage = owned?.front_image_url || card.front_image_url || ''
                      const hasImage = !!displayImage
                      const accent = memberColorMap.get(card.member_id) || memberColor
                      const wantedOnly = owned && !hasQty  // qty=0, want-only

                      const isGroupLandscape = isGroupPostcard(card)
                      // 団体ポストカードは個別と同じ長方形を 90° 回した横長枠 (5/7 → 7/5, col-span 2 → 3)
                      const cardAspect = isGroupLandscape ? '7 / 5' : getCardAspect(card.card_type)
                      const isTradingCard = isTradingCardFit(card.card_type)
                      const imgFit = getCardImageFit(card.card_type)
                      // トレカは固定枠 (cover/contain は型ごと)、それ以外は画像本来のアスペクトに追従 (img要素 + height auto)
                      const bgStyle = isTradingCard && hasImage
                        ? `rgba(243,180,227,0.15) url(${displayImage}) center / ${imgFit} no-repeat`
                        : hasQty ? 'rgba(243,180,227,0.15)' : '#E5E5EA'
                      // 8-col grid 内での占有列 (高さ揃えのため比率逆算)
                      // Tailwind JIT 用 静的マップ: col-span-2 col-span-3 col-span-4 col-span-5 col-span-6
                      const colSpan = isGroupLandscape ? 3 : getCardColSpan(card.card_type)
                      const spanClass = SPAN_CLASS_MAP[colSpan] || 'col-span-2'
                      // トレカ以外はタイル下にカード種別ラベルを出す
                      const showLabel = shouldShowTypeLabel(card.card_type)
                      const typeLabel = card.card_type ? (cardTypeLabels[card.card_type.toLowerCase()] || card.card_type) : ''
                      const tileButton = (
                        <button
                          key={card.id}
                          onClick={() => onCardTap(card, owned)}
                          className={`relative rounded-lg overflow-hidden transition-transform active:scale-95 block self-start${showLabel ? '' : ' ' + spanClass}`}
                          style={{
                            width: '100%',
                            // トレカは固定枠、それ以外は画像なしor画像時に応じて
                            ...(isTradingCard ? { aspectRatio: cardAspect } : (hasImage ? {} : { aspectRatio: cardAspect })),
                            background: bgStyle,
                            border: hasQty ? `2px solid ${accent}` : wantedOnly ? '2px dashed #60A5FA' : '2px solid transparent',
                          }}
                        >
                          {/* トレカ以外: img 要素で natural aspect 表示 */}
                          {!isTradingCard && hasImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={displayImage}
                              alt={card.card_detail || card.card_type || ''}
                              className="block w-full h-auto"
                              loading="lazy"
                            />
                          )}
                          {!hasImage && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5">
                              <svg
                                width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke={hasQty ? accent : '#8E8E93'} strokeWidth="1.5"
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                              <span
                                className="text-[11px] mt-1.5 font-bold text-center leading-tight"
                                style={{ color: hasQty ? '#1C1C1E' : '#636366' }}
                              >
                                {cleanCardDetail(card.card_detail) || card.card_type}
                              </span>
                            </div>
                          )}
                          {/* master画像（未所持）は暗く、user画像の qty=0 は薄く覆う */}
                          {!owned && hasImage && (
                            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
                          )}
                          {wantedOnly && hasImage && (
                            <div className="absolute inset-0" style={{ background: 'rgba(96,165,250,0.18)' }} />
                          )}
                          {hasQty && owned && owned.quantity > 1 && (
                            <div
                              className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                              style={{ background: '#F3B4E3', color: '#FFFFFF' }}
                            >
                              {owned.quantity}
                            </div>
                          )}
                          {wantedOnly && (
                            <div
                              className="absolute top-1 right-1 px-1.5 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
                              style={{ background: '#60A5FA', color: '#FFFFFF' }}
                            >
                              求
                            </div>
                          )}
                        </button>
                      )
                      return showLabel ? (
                        <div key={card.id} className={`${spanClass} flex flex-col gap-0.5 self-start`}>
                          {tileButton}
                          <span
                            className="text-[9px] text-center font-bold leading-tight px-0.5 truncate"
                            style={{ color: '#8E8E93' }}
                          >
                            {typeLabel}
                          </span>
                        </div>
                      ) : tileButton
                            })
                            return backTile ? [...frontTiles, backTile] : frontTiles
                          })}
                        </div>
                      </div>
                    )
                  })}
                  </div>
                </div>
    )
  }
}
