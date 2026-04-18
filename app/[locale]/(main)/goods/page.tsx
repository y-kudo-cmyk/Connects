'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/supabase/useAuth'
import { useCardProducts, useUserCards, type CardProduct, type CardMaster, type UserCard } from '@/lib/useCardData'
import AlbumList from '@/components/AlbumList'
import AlbumDetail from '@/components/AlbumDetail'
import CardDetailModal from '@/components/CardDetailModal'

export default function GoodsPage() {
  const { user } = useAuth()
  if (!user) return null
  return <GoodsContent userId={user.id} />
}

// ── Main content (separated to avoid hooks-under-condition) ───
function GoodsContent({ userId }: { userId: string }) {
  const t = useTranslations('Goods')
  const { products } = useCardProducts()
  const { userCards, refresh: refreshUserCards, deleteCard } = useUserCards(userId)

  const [selectedProduct, setSelectedProduct] = useState<CardProduct | null>(null)
  const [modalCard, setModalCard] = useState<{ card: CardMaster; owned: UserCard | null } | null>(null)

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
        <div className="px-4 pb-3">
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-xl"
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
          onClose={() => setModalCard(null)}
          onSave={refreshUserCards}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  )
}
