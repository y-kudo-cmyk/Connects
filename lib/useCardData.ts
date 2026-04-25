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
  is_published?: boolean
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

// ── Card display ratios ──────────────────────────────────────────
// Each physical goods type has its own frame aspect (width / height).
// Trading cards (photocard family) use cover-fit crop; others use contain.
//   TRADING (2:3): photocard / luckydraw / fotocard / minicard
//   PORTRAIT CARD (2:3): xmas_card / greeting_card  (same shape as photocard)
//   PHOTOBOOK (5:7 = ~0.714):  photobook — slightly taller than a photocard
//   BINDER (4:5):     binder — hardcover ~82×105mm
//   POSTER (3:4):     tear-off_poster — magazine page
//   ID CARD (8:5 landscape):  id_card — wallet size
//   SCRATCH (2:1 landscape):  scratch_card — lottery ticket
//   MAGNET (1:1):     magnet_sheet — square sheet
//   MEGA JACKET (1:1 big): mega_jacket — square LP-size jacket
//   SQUARE (1:1):     puzzle / sticker
export function getCardAspect(cardType: string | null | undefined): string {
  const t = (cardType || '').toLowerCase()
  // 比率は画像のネイティブに合わせ、col-span で高さを揃える (8-col grid想定)
  if (t === 'id_card') return '8 / 5'
  if (t === 'scratch_card') return '1 / 2'       // HB は縦長narrow
  if (t === 'fotocard') return '1 / 1'           // HB のfotocardは正方形近い
  if (t === 'postcard') return '5 / 7'           // 葉書 (個別=縦長、団体は画像側で横向きに回転)
  if (t === 'tear-off_poster') return '3 / 4'
  if (t === 'binder') return '4 / 5'
  if (t === 'folding_card') return '6 / 1'        // 細長い横長 (W300×H50 mm 等)
  if (t === 'paddle') return '7 / 3'              // 横長 パドル/うちわ系
  if (t === 'bookmark') return '1 / 2'            // ブックマーク (細長い縦)
  if (t === 'layer_card') return '1 / 1'          // 正方形ぽい
  if (t === 'clear_file') return '5 / 7'          // A5 縦
  if (t === 'ic_card') return '5 / 7'             // IC Card (店舗特典は縦長デザインが多いため統一)
  if (t === 'coaster') return '1 / 1'
  if (t === 'magnet_sheet' || t === 'mega_jacket' || t === 'photobook') return '1 / 1'
  if (t === 'puzzle' || t === 'sticker') return '1 / 1'
  // default: trading card
  return '2 / 3'
}

// 8-col grid 内で何列幅を取るか (高さを photocard に揃えるため比率逆算)
// 基準: photocard 2/8幅 = 25%、高さ = 25% × 3/2 = 37.5%
// 他タイプは高さ 37.5% 前後になるよう span 決定
export function getCardColSpan(cardType: string | null | undefined): number {
  const t = (cardType || '').toLowerCase()
  if (t === 'id_card') return 5       // 5/8=62.5%, h=62.5%×5/8=39% ≈37.5
  if (t === 'scratch_card') return 2  // 2/8=25%, h=25%×2=50% (少し高めだが許容)
  if (t === 'fotocard') return 3      // 1:1 正方形 → span 3 で高さ揃え
  if (t === 'postcard') return 2      // 2/8=25%, photocard と同じ幅 (4枚/行で揃う)
  if (t === 'magnet_sheet' || t === 'mega_jacket' || t === 'photobook') return 3 // 3/8=37.5%, h=37.5% ✓
  if (t === 'coaster') return 3
  if (t === 'puzzle' || t === 'sticker') return 3
  if (t === 'folding_card') return 6  // 6/8=75%, h=22.5% (横長のため高さ小)
  if (t === 'paddle') return 6        // 6/8=75%, 横長
  if (t === 'bookmark') return 2      // 2/8=25%, photocard と同じ幅 (細長い縦は高さで吸収)
  if (t === 'layer_card') return 3    // 1:1 → span-3
  if (t === 'clear_file') return 2    // 25% × 7/5 = 35%
  if (t === 'ic_card') return 2       // 5/7 縦、photocard と同サイズ
  if (t === 'tear-off_poster') return 2 // 25% × 4/3 = 33%
  if (t === 'binder') return 2          // 25% × 5/4 = 31%
  // default photocard: 2/8 = 25%, h = 37.5% 基準
  return 2
}

// Landscape-oriented types span 2 columns so the frame isn't cramped.
export function isLandscapeCard(cardType: string | null | undefined): boolean {
  const t = (cardType || '').toLowerCase()
  return t === 'id_card' || t === 'scratch_card'
}

// 旧API (互換のため残すがgetCardColSpanに置換推奨)
export function isWideCard(cardType: string | null | undefined): boolean {
  return getCardColSpan(cardType) > 2
}

// card_detail から内部 ID 部分 [A000001,A000002,...] を除外して表示用テキストに整形
export function cleanCardDetail(detail: string | null | undefined): string {
  if (!detail) return ''
  return detail
    .replace(/\s*\[[A-Z0-9,]+\]/g, '')  // [A000001,A000002] 等を削除
    .trim()
}

// 裏面が存在するタイプ。CD/ポスター/ステッカー/コースター/マグネット等は片面のみ。
export function hasBackSide(cardType: string | null | undefined): boolean {
  const t = (cardType || '').toLowerCase()
  const oneSided = new Set([
    'magnet_sheet',
    'mega_jacket',
    'coaster',
    'sticker',
    'clear_file',
    'cd_plate',
    'poster',
    'paddle',
    'puzzle',
    'tear-off_poster',
    'scratch_card',
    'desktop_stand',
  ])
  return !oneSided.has(t)
}

// True "trading card" types: use object-fit: cover (full-bleed frame).
// Non-trading types (photobook, magnet, mega_jacket, etc.) use object-fit: contain.
export function isTradingCardFit(cardType: string | null | undefined): boolean {
  const t = (cardType || '').toLowerCase()
  // 真のトレカ系のみ固定枠 (cover)。postcard / bookmark / 店舗特典は
  // クロップ比率そのままで表示するため除外 (img + h-auto で自然サイズ)。
  return t === 'photocard' || t === 'luckydraw' || t === 'fotocard' || t === 'minicard'
    || t === 'cd_plate'
}

// 固定枠 (isTradingCardFit) の中で画像をどう収めるか。
// トレカ系は cover で全面、それ以外はそもそも非固定枠 (この関数は使われない)。
export function getCardImageFit(cardType: string | null | undefined): 'cover' | 'contain' {
  const t = (cardType || '').toLowerCase()
  if (t === 'bookmark') return 'contain'
  return 'cover'
}

// トレカ以外 (画像だけだと種類が分かりにくい) はタイル下にラベルを出す
export function shouldShowTypeLabel(cardType: string | null | undefined): boolean {
  const t = (cardType || '').toLowerCase()
  if (!t) return false
  return t !== 'photocard' && t !== 'luckydraw' && t !== 'fotocard' && t !== 'minicard'
}

export const cardTypeLabels: Record<string, string> = {
  ic_card: 'IC Card',
  clear_file: 'Clear File',
  coaster: 'Coaster',
  postcard: 'Post Card',
  bookmark: 'Bookmark',
  cd_plate: 'CD Plate',
  sticker: 'Sticker',
  magnet_sheet: 'Magnet',
  mega_jacket: 'Mega Jacket',
  'tear-off_poster': 'Poster',
  paddle: 'Paddle',
  puzzle: 'Puzzle',
  folding_card: 'Folding Card',
  binder: 'Binder',
  photobook: 'Photo Book',
  layer_card: 'Layer Card',
  scratch_card: 'Scratch Card',
  id_card: 'ID Card',
  entry_card: 'Entry Card',
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
  concert: 'コンサート',
  tour: 'ツアー',
  fanmeet: 'ファンミーティング',
  event: 'イベント',
}

// コンサート/ツアー系は単一日付が意味を持たないため、ヘッダーで日付を出さない
export const HIDE_DATE_TYPES = new Set(['concert', 'tour', 'fanmeet', 'event'])

// ── Region tab config ───────────────────────────────────────────
export type RegionTab = 'KR' | 'JP' | 'UNIT' | 'CONCERT'

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
