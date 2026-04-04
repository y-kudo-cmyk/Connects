'use client'

import { useState, useEffect, useCallback } from 'react'
import { SeatField, SeatInfo } from './useMyEntries'

/** アリーナ俯瞰図上の正規化座標 (0〜1) */
export type ArenaPosition = { x: number; y: number }

export type SeatView = {
  id: string
  venueKeywords: string[]
  eventName: string
  eventDate: string
  seatFields: SeatField[]
  position?: ArenaPosition    // アリーナ図上の位置
  imageUrl: string
  binocularsNeeded: boolean
  distanceRating: 1 | 2 | 3 | 4 | 5
  visibilityRating: 1 | 2 | 3 | 4 | 5
  note?: string
  contributor?: string
  createdAt: string
}

/** SeatInfo のフィールド値をテキストにまとめる */
export function formatSeatInfo(info: SeatInfo | undefined): string {
  if (!info?.fields?.length) return ''
  return info.fields
    .filter((f) => f.value.trim())
    .map((f) => f.value)
    .join(' / ')
}

/** SeatView のフィールドを表示用テキストにまとめる */
export function formatSeatFields(fields: SeatField[]): string {
  return fields.filter((f) => f.value.trim()).map((f) => f.value).join(' / ')
}

// 列番号を数値に変換
function rowToNum(val: string): number {
  const n = parseInt(val)
  if (!isNaN(n)) return n
  const lower = val.toLowerCase().replace('列', '').replace('row', '').trim()
  const n2 = parseInt(lower)
  if (!isNaN(n2)) return n2
  if (lower === 'front' || lower === 'a') return 1
  if (lower === 'b') return 2
  if (lower === 'c') return 3
  return 99
}

// 会場キーワードが一致するか
function venueMatches(keywords: string[], venue: string): boolean {
  if (!venue) return false
  const lv = venue.toLowerCase()
  return keywords.some((kw) => lv.includes(kw) || kw.includes(lv.split(/[\s　]/)[0]))
}

// 値が近似一致するか（大文字小文字・スペース無視）
function valSimilar(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[\s　]/g, '')
  const na = norm(a)
  const nb = norm(b)
  return na === nb || na.includes(nb) || nb.includes(na)
}

/** 2点間のユークリッド距離 (0〜√2) */
export function arenaDistance(a: ArenaPosition, b: ArenaPosition): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/** 距離から色を返す */
export function distanceToColor(dist: number): string {
  if (dist < 0.08) return '#34D399'   // 超近い
  if (dist < 0.15) return '#86EFAC'   // 近い
  if (dist < 0.22) return '#FCD34D'   // やや近い
  if (dist < 0.32) return '#FB923C'   // やや遠い
  return '#C7C7CC'                     // 遠い
}

/** 距離からラベルを返す */
export function distanceToLabel(dist: number): string {
  if (dist < 0.08) return 'ほぼ同じ席'
  if (dist < 0.15) return 'かなり近い'
  if (dist < 0.22) return '近い席'
  if (dist < 0.32) return 'やや離れた席'
  return '離れた席'
}

export function matchSeatViews(
  views: SeatView[],
  venue: string | undefined,
  seatInfo: SeatInfo,
): SeatView[] {
  const fields = seatInfo.fields?.filter((f) => f.value.trim()) ?? []
  const myPos = seatInfo.position

  if (!venue && fields.length === 0 && !myPos) return []

  // 会場フィルター
  const filtered = venue
    ? views.filter((v) => venueMatches(v.venueKeywords, venue))
    : [...views]

  const targetArea = fields[0]?.value ?? ''
  const targetBlock = fields[1]?.value ?? ''
  const targetRow = fields[2]?.value ?? ''

  return filtered
    .filter((v) => {
      // エリアが違う場合は除外（両方テキストあり）
      if (targetArea && v.seatFields[0] && !valSimilar(v.seatFields[0].value, targetArea)) return false
      return true
    })
    .sort((a, b) => {
      // 座標距離を優先（両方に位置情報あり）
      if (myPos && a.position && b.position) {
        return arenaDistance(a.position, myPos) - arenaDistance(b.position, myPos)
      }
      // 片方だけ位置あり → 位置ありを優先
      if (myPos && a.position) return -1
      if (myPos && b.position) return 1
      // テキストマッチフォールバック
      const aBlock = targetBlock && a.seatFields[1] && valSimilar(a.seatFields[1].value, targetBlock) ? 0 : 1
      const bBlock = targetBlock && b.seatFields[1] && valSimilar(b.seatFields[1].value, targetBlock) ? 0 : 1
      if (aBlock !== bBlock) return aBlock - bBlock
      if (targetRow) {
        const t = rowToNum(targetRow)
        const ar = a.seatFields[2] ? rowToNum(a.seatFields[2].value) : 99
        const br = b.seatFields[2] ? rowToNum(b.seatFields[2].value) : 99
        return Math.abs(ar - t) - Math.abs(br - t)
      }
      return 0
    })
    .slice(0, 20)
}

const STORAGE_KEY = 'cp-seat-views'

export function useSeatViews() {
  const [views, setViews] = useState<SeatView[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setViews(JSON.parse(raw))
    } catch {}
  }, [])

  const addView = useCallback((view: SeatView) => {
    setViews((prev) => {
      const next = [view, ...prev]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const removeView = useCallback((id: string) => {
    setViews((prev) => {
      const next = prev.filter((v) => v.id !== id)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { views, addView, removeView }
}
