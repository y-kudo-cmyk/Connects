'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from './supabase/client'

const supabase = createClient()

// ── Types ────────────────────────────────────────────────────────
export interface CardProduct {
  product_id: string
  product_name: string
  product_type: string
  region: string
  release_date: string | null
  artist_id: string
  image_url: string
}

export type VersionTier = 'INCLUDED' | 'STORE_JP' | 'STORE_KR' | 'LUCKY_DRAW' | 'EVENT' | 'VENUE' | 'MERCH_BONUS'

export interface CardVersion {
  version_id: string
  product_id: string
  version_name: string
  tier?: VersionTier
  sort_order?: number
}

export interface CardMaster {
  id: string
  product_id: string
  version_id: string | null
  member_id: string
  member_name: string
  card_type: string
  card_detail: string
  front_image_url: string
  back_image_url: string
}

export interface UserCard {
  id: string
  user_id: string
  card_master_id: string | null
  product_id: string
  version_id: string
  member_id: string
  member_name: string
  front_image_url: string
  back_image_url: string
  quantity: number
  wanted_count: number | null  // ユーザー設定の「欲しい枚数」 null = デフォルトロジック適用
  notes: string
  status: string
  created_at: string
}

// ── Card display ratios (photocard=2:3, puzzle=1:1, etc.) ─────
// Frame aspect ratio per card type. Actual SEVENTEEN goods shapes:
//   photocard/luckydraw/fotocard/minicard = 2:3 vertical trading card
//   binder = 4:5 vertical hardcover binder (~82×105mm)
//   id_card = 8:5 landscape (wallet / credit-card size)
//   scratch_card = 2:1 landscape (lottery ticket style)
//   puzzle = 1:1 square
//   sticker = 1:1 square (typical album sticker)
//   tear-off_poster = 3:4 vertical poster page
// Non-trading types use 'contain' so uploaded images aren't cropped.
export function getCardAspect(cardType: string | null | undefined): string {
  const t = (cardType || '').toLowerCase()
  if (t === 'puzzle') return '1 / 1'
  if (t === 'sticker') return '1 / 1'
  if (t === 'id_card') return '8 / 5'
  if (t === 'scratch_card') return '2 / 1'
  if (t === 'tear-off_poster') return '3 / 4'
  if (t === 'binder') return '4 / 5'
  return '2 / 3'
}

// Landscape-oriented types should span more grid width to avoid tiny frames
export function isLandscapeCard(cardType: string | null | undefined): boolean {
  const t = (cardType || '').toLowerCase()
  return t === 'id_card' || t === 'scratch_card'
}

export function isTradingCardFit(cardType: string | null | undefined): boolean {
  const t = (cardType || '').toLowerCase()
  return t === 'photocard' || t === 'luckydraw' || t === 'fotocard' || t === 'minicard'
}

// ── Product type labels ─────────────────────────────────────────
export const productTypeLabels: Record<string, string> = {
  mini_album: 'Mini Album',
  full_album: 'Full Album',
  repackage: 'Repackage',
  special_album: 'Special Album',
  single: 'Single',
  single_album: 'Single Album',
  solo_album: 'Solo Album',
  unit_album: 'Unit Album',
  compilation: 'Compilation',
}

// ── Region tab config ───────────────────────────────────────────
export type RegionTab = 'KR' | 'JP' | 'UNIT' | 'EVENT'

// ── Hook: card products ─────────────────────────────────────────
export function useCardProducts() {
  const [products, setProducts] = useState<CardProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('card_products')
        .select('*')
        .order('release_date', { ascending: false })
      if (!error && data) setProducts(data)
      setLoading(false)
    }
    fetch()
  }, [])

  return { products, loading }
}

// ── Hook: versions for a product ────────────────────────────────
export function useCardVersions(productId: string | null) {
  const [versions, setVersions] = useState<CardVersion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) { setVersions([]); setLoading(false); return }
    async function fetch() {
      setLoading(true)
      const { data, error } = await supabase
        .from('card_versions')
        .select('*')
        .eq('product_id', productId)
        // Official release order (set by scripts/fix-all-album-orders.mjs)
        // with version_id as a stable tiebreaker.
        .order('sort_order', { ascending: true })
        .order('version_id', { ascending: true })
      if (!error && data) setVersions(data)
      setLoading(false)
    }
    fetch()
  }, [productId])

  return { versions, loading }
}

// ── Hook: card master for a product ─────────────────────────────
export function useCardMaster(productId: string | null) {
  const [cards, setCards] = useState<CardMaster[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) { setCards([]); setLoading(false); return }
    async function fetch() {
      setLoading(true)
      const { data, error } = await supabase
        .from('card_master')
        .select('*')
        .eq('product_id', productId)
        .order('id')
      if (!error && data) setCards(data)
      setLoading(false)
    }
    fetch()
  }, [productId])

  return { cards, loading }
}

// ── Hook: user's cards ──────────────────────────────────────────
export function useUserCards(userId: string | null) {
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) { setUserCards([]); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
    if (!error && data) setUserCards(data)
    setLoading(false)
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  const addCard = useCallback(async (card: Omit<UserCard, 'id' | 'created_at' | 'status'>) => {
    const id = `CARD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const { error } = await supabase.from('user_cards').insert({ ...card, id, status: 'ACTIVE' })
    if (error) throw error
    await refresh()
  }, [refresh])

  const updateCard = useCallback(async (id: string, updates: Partial<UserCard>) => {
    const { error } = await supabase.from('user_cards').update(updates).eq('id', id)
    if (error) throw error
    await refresh()
  }, [refresh])

  const deleteCard = useCallback(async (id: string) => {
    const { error } = await supabase.from('user_cards').update({ status: 'DELETED' }).eq('id', id)
    if (error) throw error
    await refresh()
  }, [refresh])

  return { userCards, loading, refresh, addCard, updateCard, deleteCard }
}
