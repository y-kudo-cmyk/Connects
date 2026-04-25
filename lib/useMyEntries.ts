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
  timeEnd?: string
  dateEnd?: string
  customTime?: string
  customTimeEnd?: string
  customDate?: string
  reservationNote?: string
  ticketSource?: string   // チケット入手経路 (FC_1ST / MOBILE_1ST / FC_2ND / MOBILE_2ND / LAWSON_LOTTERY / LAWSON_GENERAL / TICKET_SHARE / EQUIPMENT_RELEASE)
  ticketImages?: string[]
  seatInfo?: SeatInfo
  notes?: string
  memo: string
  posterImage?: string   // 公演ポスター (events.image_url, read-only)
  images: string[]       // 思い出写真 (ユーザーアップロード分のみ)
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
  reservation_note: string | null
  ticket_source: string | null
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
  // image_url: my_entries 側には user の思い出写真のみ、event 側のポスターは posterImage に分離
  // 旧データ互換: user 配列にポスターが混入していたら除外
  const rawUserImages = parseImageField(row.image_url)
  const posterImage = liveEvent?.image_url ?? undefined
  const images = posterImage
    ? rawUserImages.filter(u => u !== posterImage)
    : rawUserImages

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
    timeEnd: end?.slice(11, 16) ?? undefined,
    venue,
    city,
    ticketImages: parseImageField(row.ticket_image_url),
    seatInfo: row.seat_info ?? undefined,
    reservationNote: row.reservation_note ?? undefined,
    ticketSource: row.ticket_source ?? undefined,
    notes,
    memo: row.memo ?? '',
    posterImage,
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
      reservation_note: entry.reservationNote || null,
      ticket_source: entry.ticketSource || null,
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
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null
    if (updates.reservationNote !== undefined) dbUpdates.reservation_note = updates.reservationNote || null
    if (updates.ticketSource !== undefined) dbUpdates.ticket_source = updates.ticketSource || null
    if (updates.seatInfo !== undefined) dbUpdates.seat_info = updates.seatInfo || null
    if (updates.ticketImages !== undefined) dbUpdates.ticket_image_url = updates.ticketImages?.length ? JSON.stringify(updates.ticketImages) : null
    if (updates.images !== undefined) dbUpdates.image_url = updates.images?.length ? JSON.stringify(updates.images) : null
    if (updates.viewImages !== undefined) dbUpdates.view_image_url = updates.viewImages?.length ? JSON.stringify(updates.viewImages) : null

    // 時刻/日付の override: date / time / customDate / customTime 何が来ても user_start_date を組み立てる
    // 終了時刻 (customTimeEnd / timeEnd) も user_end_date に組み込み
    const dateChanged = updates.date !== undefined || updates.customDate !== undefined
    const timeChanged = updates.time !== undefined || updates.customTime !== undefined
    const endDateChanged = updates.dateEnd !== undefined
    const endTimeChanged = updates.timeEnd !== undefined || updates.customTimeEnd !== undefined
    if (dateChanged || timeChanged || endDateChanged || endTimeChanged) {
      // 既存 user_start_date / user_end_date / event.start/end_date から現在値を取得
      const { data: cur } = await supabase.from('my_entries')
        .select('user_start_date, user_end_date, start_date, end_date, event:events!my_entries_event_id_fkey(start_date, end_date)')
        .eq('id', id)
        .maybeSingle()
      const evRaw = cur?.event as unknown
      const evObj = Array.isArray(evRaw) ? (evRaw[0] as { start_date: string | null; end_date: string | null } | undefined) : (evRaw as { start_date: string | null; end_date: string | null } | null)
      // 開始
      const baseStart = (cur?.user_start_date as string | null) ?? (cur?.start_date as string | null) ?? (evObj?.start_date ?? null)
      const ms = baseStart?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
      const curStartDate = ms?.[1] ?? null
      const curStartTime = ms?.[2] ?? '00:00'
      const newStartDate = updates.customDate ?? updates.date ?? curStartDate
      const newStartTime = updates.customTime ?? updates.time ?? curStartTime
      if (dateChanged || timeChanged) {
        if (newStartDate) dbUpdates.user_start_date = `${newStartDate}T${newStartTime}:00`
      }
      // 終了
      const baseEnd = (cur?.user_end_date as string | null) ?? (cur?.end_date as string | null) ?? (evObj?.end_date ?? null)
      const me = baseEnd?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
      const curEndDate = me?.[1] ?? null
      const curEndTime = me?.[2] ?? '00:00'
      const newEndDate = updates.dateEnd !== undefined ? (updates.dateEnd || null) : curEndDate
      const newEndTime = updates.customTimeEnd ?? updates.timeEnd ?? curEndTime
      if (endDateChanged || endTimeChanged) {
        dbUpdates.user_end_date = newEndDate ? `${newEndDate}T${newEndTime}:00` : null
      }
    }

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
