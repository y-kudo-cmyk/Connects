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
  createdAt: string
  sourceUrl?: string
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
}

function toApp(row: DbMyEntry): MyEntry {
  return {
    id: row.id,
    eventId: row.event_id ?? undefined,
    title: row.event_title ?? '',
    subTitle: row.sub_event_title ?? undefined,
    type: row.tag ?? '',
    tags: row.tag ? [row.tag] : [],
    color: '',
    date: row.start_date?.slice(0, 10) ?? '',
    dateEnd: row.end_date?.slice(0, 10) ?? undefined,
    time: row.start_date?.slice(11, 16) ?? undefined,
    venue: row.spot_name ?? undefined,
    city: row.spot_address ?? undefined,
    ticketImages: row.ticket_image_url ? [row.ticket_image_url] : [],
    seatInfo: row.seat_info ?? undefined,
    notes: row.notes ?? undefined,
    memo: row.memo ?? '',
    images: row.image_url ? [row.image_url] : [],
    createdAt: row.created_at,
    sourceUrl: row.source_url ?? undefined,
  }
}

export function useMyEntries() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<MyEntry[]>([])

  const fetchEntries = useCallback(async () => {
    if (!user) { setEntries([]); return }
    const { data } = await supabase
      .from('my_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setEntries(data.map(toApp))
  }, [user])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const addEntry = useCallback(async (entry: MyEntry) => {
    if (!user) return
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
      image_url: entry.images?.[0] || null,
      source_url: entry.sourceUrl || null,
      notes: entry.notes || null,
      ticket_image_url: entry.ticketImages?.[0] || null,
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
    if (updates.ticketImages !== undefined) dbUpdates.ticket_image_url = updates.ticketImages?.[0] || null
    if (updates.images !== undefined) dbUpdates.image_url = updates.images?.[0] || null
    if (updates.date !== undefined) {
      const time = updates.time ?? updates.customTime ?? '00:00'
      dbUpdates.start_date = `${updates.date}T${time}:00`
    }
    if (updates.dateEnd !== undefined) dbUpdates.end_date = updates.dateEnd ? `${updates.dateEnd}T00:00:00` : null
    await supabase.from('my_entries').update(dbUpdates).eq('id', id)
    await fetchEntries()
  }, [user, fetchEntries])

  const removeEntry = useCallback(async (id: string) => {
    await supabase.from('my_entries').delete().eq('id', id)
    await fetchEntries()
  }, [fetchEntries])

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
