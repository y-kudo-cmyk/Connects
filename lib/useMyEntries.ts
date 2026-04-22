'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/supabase/useAuth'

const supabase = createClient()

/** 1つの座席フィールド（ラベルは会場によって自由に変更可） */
export type SeatField = { label: string; value: string }

/** 柔軟な座席情報（ラベルはユーザーが編集可能） */
export type SeatInfo = {
  fields: SeatField[]
  position?: { x: number; y: number }
}

export type MyEntry = {
  id: string
  date: string
  eventId?: string
  title: string
  subTitle?: string
  type: string
  tags?: string[]
  color: string
  venue?: string
  city?: string
  time?: string
  dateEnd?: string
  customTime?: string
  customDate?: string
  reservationNote?: string
  ticketImages?: string[]
  seatInfo?: SeatInfo
  notes?: string
  memo: string
  images: string[]
  viewImages?: string[]
  createdAt: string
  sourceUrl?: string
}

type DbEventJoin = {
  id: string
  tag: string | null
  event_title: string | null
  sub_event_title: string | null
  start_date: string | null
  end_date: string | null
  spot_name: string | null
  spot_address: string | null
  image_url: string | null
  source_url: string | null
  notes: string | null
  status: string | null
}

type DbMyEntry = {
  id: string
  user_id: string
  event_id: string | null
  tag: string | null
  artist_id: string | null
  related_artists: string | null
  event_title: string | null
  sub_event_title: string | null
  start_date: string | null
  end_date: string | null
  user_start_date: string | null
  user_end_date: string | null
  spot_name: string | null
  spot_address: string | null
  image_url: string | null
  source_url: string | null
  notes: string | null
  ticket_image_url: string | null
  view_image_url: string | null
  seat_info: SeatInfo | null
  memo: string | null
  created_at: string
  updated_at: string
  event?: DbEventJoin | null
}

/** image_urlフィールドをパース: JSON配列 or 単一URL → string[] */
function parseImageField(val: string | null): string[] {
  if (!val) return []
  if (val.startsWith('[')) {
    try { return JSON.parse(val) } catch { return [val] }
  }
  return [val]
}

function toApp(row: DbMyEntry): MyEntry {
  // 表示ロジック:
  // - event が live （event_id 有 & status != 'deleted'）→ event の最新値を優先
  // - start/end 時刻は user_start_date/user_end_date があればそちらを優先
  // - fallback: my_entries 自身のスナップショット値
  const liveEvent = row.event && row.event.status !== 'deleted' ? row.event : null

  const start = row.user_start_date ?? liveEvent?.start_date ?? row.start_date
  const end = row.user_end_date ?? liveEvent?.end_date ?? row.end_date
  const title = liveEvent?.event_title ?? row.event_title ?? ''
  const subTitle = liveEvent?.sub_event_title ?? row.sub_event_title ?? undefined
  const tag = liveEvent?.tag ?? row.tag ?? ''
  const venue = liveEvent?.spot_name ?? row.spot_name ?? undefined
  const city = liveEvent?.spot_address ?? row.spot_address ?? undefined
  const sourceUrl = liveEvent?.source_url ?? row.source_url ?? undefined
  const notes = liveEvent?.notes ?? row.notes ?? undefined
  // image_url: my_entries 側には user 画像を JSON 配列で保持、event 側は単一 URL
  // → event 画像があれば images 配列の先頭に追加（表示優先）
  const userImages = parseImageField(row.image_url)
  const images = liveEvent?.image_url
    ? [liveEvent.image_url, ...userImages.filter(u => u !== liveEvent.image_url)]
    : userImages

  return {
    id: row.id,
    eventId: row.event_id ?? undefined,
    title,
    subTitle,
    type: tag,
    tags: tag ? [tag] : [],
    color: '',
    date: start?.slice(0, 10) ?? '',
    dateEnd: end?.slice(0, 10) ?? undefined,
    time: start?.slice(11, 16) ?? undefined,
    venue,
    city,
    ticketImages: parseImageField(row.ticket_image_url),
    seatInfo: row.seat_info ?? undefined,
    notes,
    memo: row.memo ?? '',
    images,
    viewImages: parseImageField(row.view_image_url),
    createdAt: row.created_at,
    sourceUrl,
  }
}

export function useMyEntries() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<MyEntry[]>([])

  const fetchEntries = useCallback(async () => {
    if (!user) { setEntries([]); return }
    const { data } = await supabase
      .from('my_entries')
      .select('*, event:events!my_entries_event_id_fkey(id, tag, event_title, sub_event_title, start_date, end_date, spot_name, spot_address, image_url, source_url, notes, status)')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (data) setEntries(data.map((d: unknown) => toApp(d as DbMyEntry)))
  }, [user])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  // タブ表示復帰 / ウィンドウフォーカス時に再取得 (他画面で更新されたデータを反映)
  useEffect(() => {
    const refetchIfVisible = () => {
      if (document.visibilityState === 'visible') fetchEntries()
    }
    document.addEventListener('visibilitychange', refetchIfVisible)
    window.addEventListener('focus', fetchEntries)
    return () => {
      document.removeEventListener('visibilitychange', refetchIfVisible)
      window.removeEventListener('focus', fetchEntries)
    }
  }, [fetchEntries])

  const addEntry = useCallback(async (entry: MyEntry) => {
    if (!user) return
    supabase.from('user_activity').insert({ user_id: user.id, action: 'add_my', detail: entry.title }).then(() => {})
    await supabase.from('my_entries').insert({
      user_id: user.id,
      event_id: entry.eventId || null,
      tag: entry.tags?.[0] || entry.type || null,
      event_title: entry.title,
      sub_event_title: entry.subTitle || null,
      start_date: entry.date ? (entry.time ? `${entry.date}T${entry.time}:00` : `${entry.date}T00:00:00`) : null,
      end_date: entry.dateEnd ? `${entry.dateEnd}T00:00:00` : null,
      spot_name: entry.venue || null,
      spot_address: entry.city || null,
      image_url: entry.images?.length ? JSON.stringify(entry.images) : null,
      source_url: entry.sourceUrl || null,
      notes: entry.notes || null,
      ticket_image_url: entry.ticketImages?.length ? JSON.stringify(entry.ticketImages) : null,
      seat_info: entry.seatInfo || null,
      memo: entry.memo || null,
    })
    await fetchEntries()
  }, [user, fetchEntries])

  const updateEntry = useCallback(async (id: string, updates: Partial<MyEntry>) => {
    if (!user) return
    const dbUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) dbUpdates.event_title = updates.title
    if (updates.venue !== undefined) dbUpdates.spot_name = updates.venue || null
    if (updates.memo !== undefined) dbUpdates.memo = updates.memo || null
    if (updates.seatInfo !== undefined) dbUpdates.seat_info = updates.seatInfo || null
    if (updates.ticketImages !== undefined) dbUpdates.ticket_image_url = updates.ticketImages?.length ? JSON.stringify(updates.ticketImages) : null
    if (updates.images !== undefined) dbUpdates.image_url = updates.images?.length ? JSON.stringify(updates.images) : null
    if (updates.viewImages !== undefined) dbUpdates.view_image_url = updates.viewImages?.length ? JSON.stringify(updates.viewImages) : null
    // 時刻変更は user_start_date / user_end_date に保存（event 最新値を上書き）
    if (updates.date !== undefined) {
      const time = updates.time ?? updates.customTime ?? '00:00'
      dbUpdates.user_start_date = `${updates.date}T${time}:00`
    }
    if (updates.dateEnd !== undefined) dbUpdates.user_end_date = updates.dateEnd ? `${updates.dateEnd}T00:00:00` : null
    await supabase.from('my_entries').update(dbUpdates).eq('id', id)
    await fetchEntries()
  }, [user, fetchEntries])

  const removeEntry = useCallback(async (id: string) => {
    await supabase.from('my_entries').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (user) {
      await supabase.from('user_activity').insert({
        user_id: user.id,
        action: 'delete_my_entry',
        detail: JSON.stringify({ entry_id: id }),
      })
    }
    await fetchEntries()
  }, [user, fetchEntries])

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
