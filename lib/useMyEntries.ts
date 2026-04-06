'use client'

import { useState, useEffect, useCallback } from 'react'

/** 1つの座席フィールド（ラベルは会場によって自由に変更可） */
export type SeatField = { label: string; value: string }

/** 柔軟な座席情報（ラベルはユーザーが編集可能） */
export type SeatInfo = {
  fields: SeatField[]
  position?: { x: number; y: number }  // アリーナ図上の正規化座標
}

export type MyEntry = {
  id: string
  date: string          // YYYY-MM-DD（表示日・デフォルトは元イベントの開始日）
  eventId?: string      // スケジュールからの転記元 ID
  title: string
  type: string          // EventType | 'memo'
  color: string
  venue?: string
  city?: string
  time?: string         // 元イベントの時間
  dateEnd?: string      // 元イベントの終了日（期間イベント）
  customTime?: string      // ユーザーが設定した実際の予約時間
  customDate?: string      // ユーザーが選んだ来場日（期間イベント）
  reservationNote?: string // 予約番号・確認番号など
  ticketImages?: string[]  // 電子チケット・確認書のスクショ
  seatInfo?: SeatInfo      // 座席情報
  memo: string
  images: string[]         // 日記・思い出の写真
  createdAt: string
}

const STORAGE_KEY = 'cp-my-entries'

export function useMyEntries() {
  const [entries, setEntries] = useState<MyEntry[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setEntries(JSON.parse(raw))
    } catch {}
  }, [])

  const addEntry = useCallback((entry: MyEntry) => {
    setEntries((prev) => {
      const next = [...prev, entry]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const updateEntry = useCallback((id: string, updates: Partial<MyEntry>) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const hasEntry = useCallback(
    (eventId: string) => entries.some((e) => e.eventId === eventId),
    [entries],
  )

  const findEntryByEventId = useCallback(
    (eventId: string) => entries.find((e) => e.eventId === eventId),
    [entries],
  )

  return { entries, addEntry, updateEntry, removeEntry, hasEntry, findEntryByEventId }
}

/** 画像をリサイズ・圧縮して data URL に変換 */
export async function compressImage(file: File, maxPx = 800, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        let { width: w, height: h } = img
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round((h * maxPx) / w); w = maxPx }
          else { w = Math.round((w * maxPx) / h); h = maxPx }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}
