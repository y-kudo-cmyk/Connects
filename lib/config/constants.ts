export const PAID_FEATURE_ENABLED = false

export type TagType = 'LIVE' | 'TICKET' | 'CD' | 'GOODS' | 'EVENT' | 'TV' | 'YOUTUBE' | 'RADIO' | 'LUCKYDRAW' | 'POPUP'

export const tagConfig: Record<TagType, { label: string; icon: string; color: string; bg: string }> = {
  LIVE:      { label: 'LIVE',      icon: '🎤', color: '#F3B4E3', bg: 'rgba(243,180,227,0.15)' },
  TICKET:    { label: 'TICKET',    icon: '🎫', color: '#FCD34D', bg: 'rgba(252,211,77,0.15)'  },
  CD:        { label: 'CD',        icon: '💿', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  GOODS:     { label: 'GOODS',     icon: '🛒', color: '#34D399', bg: 'rgba(52,211,153,0.15)'  },
  EVENT:     { label: 'EVENT',     icon: '❤️', color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
  POPUP:     { label: 'POPUP',     icon: '🏪', color: '#FB923C', bg: 'rgba(251,146,60,0.15)'  },
  TV:        { label: 'TV',        icon: '📺', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)'  },
  YOUTUBE:   { label: 'YOUTUBE',   icon: '▶️', color: '#FB923C', bg: 'rgba(251,146,60,0.15)'  },
  RADIO:     { label: 'RADIO',     icon: '📻', color: '#4ADE80', bg: 'rgba(74,222,128,0.15)'  },
  LUCKYDRAW: { label: 'LUCKYDRAW', icon: '🂠', color: '#E879F9', bg: 'rgba(232,121,249,0.15)' },
}

export type CardType = 'normal' | 'rare' | 'ur' | 'sp'

export const cardTypeConfig: Record<CardType, { label: string; color: string; bg: string }> = {
  normal: { label: 'NORMAL', color: '#9A9A9F', bg: 'rgba(154,154,159,0.15)' },
  rare:   { label: 'RARE',   color: '#60A5FA', bg: 'rgba(96,165,250,0.15)'  },
  ur:     { label: 'UR',     color: '#F3B4E3', bg: 'rgba(243,180,227,0.15)' },
  sp:     { label: 'SP',     color: '#FCD34D', bg: 'rgba(252,211,77,0.15)'  },
}

export const seventeenMembers = [
  { id: 'scoups',   name: 'S.COUPS',   color: '#3B82F6', photo: '/scoups.jpg'   },
  { id: 'jeonghan', name: 'JEONGHAN',  color: '#8B5CF6', photo: '/jeonghan.jpg' },
  { id: 'joshua',   name: 'JOSHUA',    color: '#06B6D4', photo: '/joshua.jpg'   },
  { id: 'jun',      name: 'JUN',       color: '#10B981', photo: '/jun.jpg'      },
  { id: 'hoshi',    name: 'HOSHI',     color: '#F59E0B', photo: '/hoshi.jpg'    },
  { id: 'wonwoo',   name: 'WONWOO',    color: '#6366F1', photo: '/wonwoo.jpg'   },
  { id: 'woozi',    name: 'WOOZI',     color: '#EC4899', photo: '/woozi.jpg'    },
  { id: 'the8',     name: 'THE 8',     color: '#84CC16', photo: '/the8.jpg'     },
  { id: 'mingyu',   name: 'MINGYU',    color: '#14B8A6', photo: '/mingyu.jpg'   },
  { id: 'dk',       name: 'DK',        color: '#F97316', photo: '/dk.jpg'       },
  { id: 'seungkwan',name: 'SEUNGKWAN', color: '#EF4444', photo: '/seungkwan.jpg'},
  { id: 'vernon',   name: 'VERNON',    color: '#A78BFA', photo: '/vernon.jpg'   },
  { id: 'dino',     name: 'DINO',      color: '#FB923C', photo: '/dino.jpg'     },
]

export type EventType = 'concert' | 'fanmeet' | 'release' | 'broadcast' | 'birthday' | 'variety'

export const eventTypeConfig: Record<EventType, { label: string; color: string; bg: string }> = {
  concert: { label: 'CONCERT', color: '#F3B4E3', bg: 'rgba(243,180,227,0.15)' },
  fanmeet: { label: 'FAN MEET', color: '#FCD34D', bg: 'rgba(252,211,77,0.15)' },
  release: { label: 'RELEASE', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  broadcast: { label: 'BROADCAST', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  birthday: { label: 'BIRTHDAY', color: '#FB923C', bg: 'rgba(251,146,60,0.15)' },
  variety: { label: 'VARIETY', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
}

export type SpotGenre = 'cafe' | 'restaurant' | 'fashion' | 'entertainment' | 'music' | 'other'

export const spotGenreConfig: Record<SpotGenre, { label: string; icon: string; color: string; bg: string }> = {
  cafe:          { label: 'カフェ',     icon: '☕', color: '#FCD34D', bg: 'rgba(252,211,77,0.15)'  },
  restaurant:    { label: 'グルメ',     icon: '🍜', color: '#FB923C', bg: 'rgba(251,146,60,0.15)'  },
  fashion:       { label: 'ファッション', icon: '👗', color: '#F3B4E3', bg: 'rgba(243,180,227,0.15)' },
  entertainment: { label: 'エンタメ',   icon: '🎭', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  music:         { label: '音楽',       icon: '🎵', color: '#34D399', bg: 'rgba(52,211,153,0.15)'  },
  other:         { label: 'その他',     icon: '📍', color: '#9A9A9F', bg: 'rgba(154,154,159,0.15)' },
}

export type SpotPlatform = 'instagram' | 'weverse' | 'x' | 'other'

export type SpotPhoto = {
  id: string
  imageUrl?: string
  sourceUrl?: string
  platform?: SpotPlatform
  tags: string[]
  contributor: string
  date: string
  caption?: string
  votes: number
  status: 'pending' | 'confirmed'
}

export type PilgrimageSpot = {
  id: string
  name: string
  nameLocal: string
  address: string
  city: string
  genre: SpotGenre
  members: string[]
  description: string
  lat: number
  lng: number
  officialUrl?: string
  sourceUrl?: string
  sourceName?: string
  photos?: SpotPhoto[]
  contributor?: string  // 投稿者ニックネーム
}

/** スポットが「情報完備」かどうか（ピンの色判定用） */
export function isSpotComplete(spot: { photos?: { id: string; sourceUrl?: string; tags?: string[] }[]; members?: string[]; sourceUrl?: string; name?: string; address?: string; genre?: string }, confirmedUserPhotoCount: number): boolean {
  const seedCount = spot.photos?.length ?? 0
  const hasPhotos = (seedCount + confirmedUserPhotoCount) > 0
  const hasMembers = (spot.members ?? []).some(m => m !== 'ALL')
  const hasSource = !!(spot.sourceUrl || spot.photos?.some(p => p.sourceUrl))
  return hasPhotos && hasMembers && hasSource
}

/** 韓国 → NAVER MAP / 日本 → Google Maps */
export function getMapUrl(spot: { city: string; nameLocal: string; name: string; lat: number; lng: number }): string {
  const isKorea = spot.city === 'Seoul' || spot.city === 'Busan' || spot.city === 'Incheon'
  const q = encodeURIComponent(spot.nameLocal || spot.name)
  if (isKorea) {
    return `https://map.naver.com/v5/search/${q}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${q}+${spot.lat},${spot.lng}`
}

export function getMapAppName(spot: { city: string }): string {
  const isKorea = spot.city === 'Seoul' || spot.city === 'Busan'
  return isKorea ? 'NAVER MAP' : 'マップで開く'
}
