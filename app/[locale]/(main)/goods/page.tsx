'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/lib/supabase/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useCardProducts, useUserCards, type CardProduct, type CardMaster, type UserCard } from '@/lib/useCardData'
import AlbumList from '@/components/AlbumList'
import AlbumDetail from '@/components/AlbumDetail'
import CardDetailModal from '@/components/CardDetailModal'
import ShareCollectionModal from '@/components/ShareCollectionModal'

// admin/fam 以外でも GOODS を閲覧できる追加ユーザーID (現在は空、全員 fam ロールに移行済み)
const EXTRA_GOODS_USER_IDS: string[] = []

export default function GoodsPage() {
  const t = useTranslations()
  const { user } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [roleLoaded, setRoleLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        setRole(data?.role ?? null)
        setRoleLoaded(true)
      })
  }, [user?.id])

  if (!user || !roleLoaded) return null

  const allowed = role === 'admin' || role === 'fam' || EXTRA_GOODS_USER_IDS.includes(user.id)
  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100vh', background: '#F8F9FA' }}>
        <div className="flex flex-col items-center gap-4 px-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(243,180,227,0.15)' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <h1 className="text-xl font-black" style={{ color: '#1C1C1E' }}>GOODS</h1>
          <p className="text-sm text-center leading-relaxed" style={{ color: '#8E8E93' }}>
            {t('Goods.goodsComingSoon')}
          </p>
          <span
            className="text-xs font-bold px-4 py-2 rounded-full"
            style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}
          >
            {t('Common.comingSoon')}
          </span>
        </div>
      </div>
    )
  }

  return <GoodsContent userId={user.id} isAdmin={role === 'admin'} />
}

// ── Main content (separated to avoid hooks-under-condition) ───
function GoodsContent({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const t = useTranslations('Goods')
  const locale = useLocale()
  const { products } = useCardProducts()
  const { userCards, refresh: refreshUserCards, deleteCard } = useUserCards(userId)

  const [selectedProduct, setSelectedProduct] = useState<CardProduct | null>(null)
  const [modalCard, setModalCard] = useState<{ card: CardMaster; owned: UserCard | null } | null>(null)
  const [shareModal, setShareModal] = useState<{ initialProductId?: string } | null>(null)
  const [favMemberIds, setFavMemberIds] = useState<string[]>([])
  // 譲・求シェア / 欲しい枚数 は全ユーザー利用可
  const isBetaUser = true

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles').select('fav_member_ids').eq('id', userId).maybeSingle()
      .then(({ data }) => {
        const ids = (data?.fav_member_ids as string[] | null) ?? []
        setFavMemberIds(Array.isArray(ids) ? ids : [])
      })
  }, [userId])

  // Build product card counts for the album list
  const userCardProductIds = useMemo(() => {
    return new Set(userCards.map(uc => uc.product_id))
  }, [userCards])

  const productCardCounts = useMemo(() => {
    // We don't have card_master counts per product in the hook results,
    // so we'll calculate from userCards only (owned counts)
    const m = new Map<string, { total: number; owned: number }>()
    for (const uc of userCards) {
      if (!m.has(uc.product_id)) m.set(uc.product_id, { total: 0, owned: 0 })
      m.get(uc.product_id)!.owned++
    }
    return m
  }, [userCards])

  const handleCardTap = useCallback((card: CardMaster, owned: UserCard | null) => {
    setModalCard({ card, owned })
  }, [])

  const handleDeleteCard = useCallback(async (id: string) => {
    await deleteCard(id)
  }, [deleteCard])

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Header */}
      <div className="px-4 pb-2" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
        <h1 className="text-lg font-black tracking-wider" style={{ color: '#1C1C1E' }}>
          {t('goodsTitle')}
        </h1>
        <p className="text-[10px] mt-0.5" style={{ color: '#8E8E93' }}>{t('digitalAlbumDesc')}</p>
      </div>

      {/* Stats bar */}
      {userCards.length > 0 && (
        <div className="px-4 pb-3 flex gap-2">
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-xl flex-1"
            style={{ background: 'rgba(243,180,227,0.08)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-xs font-bold" style={{ color: '#636366' }}>
              {t('collectionCount', { count: userCards.length })}
            </span>
          </div>
          {isBetaUser && (
            <button
              onClick={() => setShareModal({ initialProductId: selectedProduct?.product_id })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#1C1C1E', color: '#FFFFFF' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              譲・求シェア
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {selectedProduct ? (
        <AlbumDetail
          product={selectedProduct}
          userCards={userCards}
          onBack={() => setSelectedProduct(null)}
          onCardTap={handleCardTap}
        />
      ) : (
        <AlbumList
          onSelect={setSelectedProduct}
          userCardProductIds={userCardProductIds}
          productCardCounts={productCardCounts}
        />
      )}

      {/* Card detail modal */}
      {modalCard && (
        <CardDetailModal
          card={modalCard.card}
          owned={modalCard.owned}
          userId={userId}
          isBetaUser={isBetaUser}
          favMemberIds={favMemberIds}
          onClose={() => setModalCard(null)}
          onSave={refreshUserCards}
          onDelete={handleDeleteCard}
        />
      )}

      {/* Share collection modal */}
      {shareModal && (
        <ShareCollectionModal
          userId={userId}
          locale={locale}
          products={products}
          userCards={userCards}
          initialProductId={shareModal.initialProductId}
          onClose={() => setShareModal(null)}
        />
      )}
    </div>
  )
}
