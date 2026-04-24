'use client'

import { useEffect, useState, useCallback, useRef, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toAppEvent, toAppSpot, type AppEvent, type AppSpot } from '@/lib/supabase/adapters'
import type { SupabaseEvent } from '@/lib/supabase/useEvents'
import type { SupabaseSpot, SupabaseSpotPhoto } from '@/lib/supabase/useSpots'

const supabase = createClient()

type DataContextType = {
  events: AppEvent[]
  spots: AppSpot[]
  loading: boolean
  refreshSpots: () => Promise<void>
  refreshEvents: () => Promise<void>
}

const DataContext = createContext<DataContextType>({ events: [], spots: [], loading: true, refreshSpots: async () => {}, refreshEvents: async () => {} })

export function useSupabaseData() {
  return useContext(DataContext)
}

function getMonthRange(y: number, m: number) {
  const start = `${y}-${String(m).padStart(2, '0')}-01T00:00:00`
  const nm = m === 12 ? 1 : m + 1
  const ny = m === 12 ? y + 1 : y
  return { start, end: `${ny}-${String(nm).padStart(2, '0')}-01T00:00:00` }
}

// stale-while-revalidate 閾値: 前回 fetch から FRESH_MS 以内ならスキップ
const FRESH_MS = 60 * 1000 // 1 min

export default function SupabaseDataProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [spots, setSpots] = useState<AppSpot[]>([])
  const [loading, setLoading] = useState(true)
  const lastEventsAt = useRef(0)
  const lastSpotsAt = useRef(0)

  const refreshEvents = useCallback(async (force = false) => {
    if (!force && Date.now() - lastEventsAt.current < FRESH_MS) return
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    // 取得範囲: 先月1日 〜 4ヶ月先末 (将来の当選発表や公演本編も拾えるよう拡大)
    const prevM = m === 1 ? 12 : m - 1
    const prevY = m === 1 ? y - 1 : y
    const future = 4  // 何ヶ月先まで fetch するか
    const endMRaw = m + future
    const endM = ((endMRaw - 1) % 12) + 1
    const endY = y + Math.floor((endMRaw - 1) / 12)

    const { start } = getMonthRange(prevY, prevM)
    const { end } = getMonthRange(endY, endM)

    const [{ data: d1 }, { data: d2 }] = await Promise.all([
      // start_date がレンジ内
      supabase.from('events')
        .select('*, submitter:profiles!submitted_by(nickname)')
        .gte('start_date', start).lt('start_date', end)
        .order('start_date'),
      // 期間イベント: start_date < 先月1日 だが end_date >= 先月1日
      supabase.from('events')
        .select('*, submitter:profiles!submitted_by(nickname)')
        .lt('start_date', start).gte('end_date', start)
        .order('start_date'),
    ])

    const seen = new Set<string>()
    const all: SupabaseEvent[] = []
    for (const e of [...(d1 || []), ...(d2 || [])]) {
      if (!seen.has(e.id)) {
        seen.add(e.id)
        all.push(e as SupabaseEvent)
      }
    }
    setEvents(all.map(toAppEvent))
    lastEventsAt.current = Date.now()
  }, [])

  const refreshSpots = useCallback(async (force = false) => {
    if (!force && Date.now() - lastSpotsAt.current < FRESH_MS) return
    // spot_photos を nested select でサーバー側 join — N+1 と O(N*M) フィルタ解消
    const SPOT_COLS = 'id, spot_name, spot_address, spot_url, genre, artist_id, related_artists, image_url, source_url, memo, lat, lng, is_master, submitted_by, status, verified_count, x_posted, created_at, updated_at, submitter:profiles!submitted_by(nickname), spot_photos(id, spot_id, image_url, source_url, platform, tags, contributor, visit_date, caption, status, votes, created_at, submitted_by)'
    const { data, error } = await supabase
      .from('spots')
      .select(SPOT_COLS)
      // pending/confirmed だけ表示 ('rejected' は非公開、'deleted' は CHECK 制約追加後)
      .in('status', ['pending', 'confirmed'])
      .order('spot_name')

    if (error) {
      console.error('[SupabaseDataProvider] spots fetch error:', error.message)
      return
    }
    if (!data) return

    type SpotWithPhotos = SupabaseSpot & { spot_photos?: SupabaseSpotPhoto[] }
    const rows = data as unknown as SpotWithPhotos[]
    setSpots(
      rows.map((s) =>
        toAppSpot(
          s as SupabaseSpot,
          (s.spot_photos || []).filter((p) => p.status === 'pending' || p.status === 'confirmed'),
        ),
      ),
    )
    lastSpotsAt.current = Date.now()
  }, [])

  useEffect(() => {
    // events を先に解決 → UI を早く unblock、spots は裏で取得 (HOME/schedule は events しか使わない)
    refreshEvents(true).finally(() => setLoading(false))
    refreshSpots(true)
  }, [refreshEvents, refreshSpots])

  // タブ復帰時に stale-while-revalidate (閾値超えてたら裏で再取得)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      refreshEvents()
      refreshSpots()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refreshEvents, refreshSpots])

  return (
    <DataContext.Provider
      value={{
        events,
        spots,
        loading,
        refreshSpots: () => refreshSpots(true),
        refreshEvents: () => refreshEvents(true),
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
