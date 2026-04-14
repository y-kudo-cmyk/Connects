/**
 * Supabase のデータ型 → アプリの型への変換アダプター
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
  submittedBy?: string
  status: string
  verifiedCount: number
  relatedArtists: string
  subTitle?: string
  submittedByName?: string
  createdAt?: string
}

// タイムゾーンずれを防ぐ: DBの日時文字列から直接 YYYY-MM-DD と HH:MM を取る
function extractDateParts(isoStr: string): { date: string; time: string } {
  // "2026-04-05T18:00:00+00:00" or "2026-04-05T18:00:00"
  const match = isoStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (match) return { date: match[1], time: match[2] }
  // "2026-04-05" only
  if (isoStr.match(/^\d{4}-\d{2}-\d{2}$/)) return { date: isoStr, time: '00:00' }
  return { date: '', time: '00:00' }
}

export function toAppEvent(e: SupabaseEvent): AppEvent {
  const start = e.start_date ? extractDateParts(e.start_date) : { date: '', time: '00:00' }
  const end = e.end_date ? extractDateParts(e.end_date) : null

  const date = start.date
  const dateEnd = end?.date !== start.date ? end?.date : undefined
  const time = start.time
  const timeEnd = end?.time

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
    image: convertDriveUrl(e.image_url) || undefined,
    sourceUrl: e.source_url || undefined,
    sourceName: e.source_url ? extractSourceName(e.source_url) : undefined,
    notes: e.notes || undefined,
    submittedBy: e.submitted_by || undefined,
    status: e.status,
    verifiedCount: e.verified_count,
    relatedArtists: e.related_artists,
    subTitle: e.sub_event_title || undefined,
    submittedByName: e.submitter?.nickname || undefined,
    createdAt: e.created_at || undefined,
  }
}

// Google Drive の共有リンクを直接表示可能なURLに変換
function convertDriveUrl(url: string): string {
  if (!url) return ''
  // https://drive.google.com/file/d/XXXX/view... → https://lh3.googleusercontent.com/d/XXXX
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (driveMatch) return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`
  // https://docs.google.com/uc?export=view&id=XXXX
  const docsMatch = url.match(/docs\.google\.com\/uc\?export=view&id=([^&]+)/)
  if (docsMatch) return `https://lh3.googleusercontent.com/d/${docsMatch[1]}`
  // already lh3 or other URL
  return url
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
  contributor?: string
  submittedByName?: string
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
    submittedByName: s.submitter?.nickname || undefined,
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
