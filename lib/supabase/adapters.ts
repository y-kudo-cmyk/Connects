/**
 * Supabase のデータ型 → アプリの既存型への変換アダプター
 * mockData の型をそのまま使いつつ、データソースだけ切り替える
 */

import type { SupabaseEvent } from './useEvents'
import type { SupabaseSpot, SupabaseSpotPhoto } from './useSpots'
import type { ScheduleTag } from '@/lib/config/tags'
import { scheduleTagConfig } from '@/lib/config/tags'

// ── Event 変換 ───────────────────────────────────────────────
export type AppEvent = {
  id: string
  type: string
  artist: string
  artistColor: string
  title: string
  date: string
  dateEnd?: string
  time: string
  timeEnd?: string
  venue?: string
  city?: string
  tags?: ScheduleTag[]
  image?: string
  sourceUrl?: string
  sourceName?: string
  notes?: string
  status: string
  verifiedCount: number
  relatedArtists: string
  subTitle?: string
}

export function toAppEvent(e: SupabaseEvent): AppEvent {
  const startDate = e.start_date ? new Date(e.start_date) : null
  const endDate = e.end_date ? new Date(e.end_date) : null

  const date = startDate ? startDate.toISOString().slice(0, 10) : ''
  const dateEnd = endDate ? endDate.toISOString().slice(0, 10) : undefined
  const time = startDate
    ? `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
    : '00:00'
  const timeEnd = endDate
    ? `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
    : undefined

  const tag = e.tag as ScheduleTag
  const cfg = scheduleTagConfig[tag]

  return {
    id: e.id,
    type: tag === 'BIRTHDAY' ? 'birthday' : tag === 'LIVE' ? 'concert' : 'variety',
    artist: 'SEVENTEEN',
    artistColor: cfg?.color ?? '#636366',
    title: e.event_title,
    date,
    dateEnd: dateEnd !== date ? dateEnd : undefined,
    time,
    timeEnd,
    venue: e.spot_name || undefined,
    city: e.country || undefined,
    tags: [tag],
    image: e.image_url || undefined,
    sourceUrl: e.source_url || undefined,
    sourceName: e.source_url ? extractSourceName(e.source_url) : undefined,
    notes: e.notes || undefined,
    status: e.status,
    verifiedCount: e.verified_count,
    relatedArtists: e.related_artists,
    subTitle: e.sub_event_title || undefined,
  }
}

function extractSourceName(url: string): string {
  if (url.includes('seventeen-17.jp')) return 'seventeen-17.jp'
  if (url.includes('weverse.io')) return 'Weverse'
  if (url.includes('instagram.com')) return 'Instagram'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'X'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube'
  try { return new URL(url).hostname } catch { return 'ソース' }
}

// ── Spot 変換 ────────────────────────────────────────────────
export type AppSpot = {
  id: string
  name: string
  nameLocal: string
  address: string
  city: string
  genre: string
  members: string[]
  description: string
  lat: number
  lng: number
  officialUrl?: string
  sourceUrl?: string
  sourceName?: string
  photos?: AppSpotPhoto[]
  status: string
  verifiedCount: number
}

export type AppSpotPhoto = {
  id: string
  imageUrl?: string
  sourceUrl?: string
  platform?: string
  tags: string[]
  contributor: string
  date: string
  caption?: string
  votes: number
  status: string
}

export function toAppSpot(s: SupabaseSpot, photos: SupabaseSpotPhoto[]): AppSpot {
  // related_artists から メンバー名を抽出: "#SEVENTEEN #S.COUPS" → ["S.COUPS"]
  const members = (s.related_artists || '')
    .split('#')
    .map(m => m.trim())
    .filter(m => m && m !== 'SEVENTEEN')

  return {
    id: s.id,
    name: s.spot_name,
    nameLocal: s.spot_name,
    address: s.spot_address,
    city: '',
    genre: s.genre.toLowerCase(),
    members: members.length > 0 ? members : ['ALL'],
    description: s.memo || '',
    lat: s.lat ?? 0,
    lng: s.lng ?? 0,
    officialUrl: s.spot_url || undefined,
    sourceUrl: s.source_url || undefined,
    sourceName: s.source_url ? extractSourceName(s.source_url) : undefined,
    photos: photos.map(toAppSpotPhoto),
    status: s.status,
    verifiedCount: s.verified_count,
  }
}

function toAppSpotPhoto(p: SupabaseSpotPhoto): AppSpotPhoto {
  const tags = (p.tags || '')
    .split('#')
    .map(t => t.trim())
    .filter(Boolean)

  return {
    id: p.id,
    imageUrl: p.image_url || undefined,
    sourceUrl: p.source_url || undefined,
    platform: p.platform,
    tags,
    contributor: p.contributor || '',
    date: p.visit_date || '',
    caption: p.caption || undefined,
    votes: p.votes,
    status: p.status,
  }
}
