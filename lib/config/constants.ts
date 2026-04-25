export const PAID_FEATURE_ENABLED = false

export type TagType = 'CONCERT' | 'TICKET' | 'CD' | 'GOODS' | 'EVENT' | 'TV' | 'YOUTUBE' | 'RADIO' | 'LUCKYDRAW' | 'POPUP'

export const tagConfig: Record<TagType, { label: string; icon: string; color: string; bg: string }> = {
  CONCERT:   { label: 'CONCERT',   icon: '🎤', color: '#F3B4E3', bg: 'rgba(243,180,227,0.15)' },
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

// SEVENTEEN 3ユニット構成 (ユニット共通カード = M∞CARD 等の判定に使用)
// member_id は A000001〜A000013 (seventeenMembers の index + 1)
export const SEVENTEEN_UNITS = {
  HIPHOP:      ['A000001', 'A000006', 'A000009', 'A000012'],              // S.Coups, Wonwoo, Mingyu, Vernon
  PERFORMANCE: ['A000005', 'A000004', 'A000008', 'A000013'],              // Hoshi, Jun, The8, Dino
  VOCAL:       ['A000002', 'A000003', 'A000007', 'A000010', 'A000011'],   // Jeonghan, Joshua, Woozi, DK, Seungkwan
} as const

// 各ユニットのリーダー (ユニット共通カードの member_id として使用)
export const UNIT_LEADERS = {
  HIPHOP:      'A000001', // S.Coups
  PERFORMANCE: 'A000005', // Hoshi
  VOCAL:       'A000007', // Woozi
} as const

export type SeventeenUnit = keyof typeof SEVENTEEN_UNITS

// 年齢ライン (誕生年別グループ — Teen, Age 等のFolding Posterに使用)
export const SEVENTEEN_AGE_LINES = {
  '95':    ['A000001', 'A000002', 'A000003'],                                     // S.Coups, Jeonghan, Joshua
  '96':    ['A000004', 'A000005', 'A000006', 'A000007'],                          // Jun, Hoshi, Wonwoo, Woozi
  '97':    ['A000008', 'A000009', 'A000010'],                                     // The8, Mingyu, DK
  '98_99': ['A000011', 'A000012', 'A000013'],                                     // Seungkwan, Vernon, Dino
} as const

export const AGE_LINE_LEADERS = {
  '95':    'A000001', // S.Coups
  '96':    'A000004', // Jun
  '97':    'A000008', // The8
  '98_99': 'A000011', // Seungkwan
} as const

export type SeventeenAgeLine = keyof typeof SEVENTEEN_AGE_LINES

/** 指定 memberId が所属する年齢ライン */
export function getMemberAgeLine(memberId: string): SeventeenAgeLine | null {
  for (const [line, members] of Object.entries(SEVENTEEN_AGE_LINES)) {
    if ((members as readonly string[]).includes(memberId)) return line as SeventeenAgeLine
  }
  return null
}

/** 指定 memberId と同じ年齢ラインの代表 member_id */
export function getAgeLineLeaderForMember(memberId: string): string | null {
  const line = getMemberAgeLine(memberId)
  return line ? AGE_LINE_LEADERS[line] : null
}

/** カードが年齢ライン共通カードかどうか (card_detail で判定) */
export function isAgeLineSharedCard(cardDetail?: string | null): boolean {
  if (!cardDetail) return false
  const d = cardDetail.toLowerCase()
  // "95line" "96line" "97line" "98line" "99line" "98,99line" など
  return /\d{2}\s*,?\s*\d{0,2}\s*line\b/i.test(cardDetail)
}

// 集合写真 (グループショット) — 1枚に複数メンバー、13人を任意のグループに分割
// あとで実際の写真に応じて変更可能
export const GROUP_SHOT_SPLITS: Record<string, readonly string[]> = {
  '1': ['A000001', 'A000002', 'A000003', 'A000004', 'A000005', 'A000006', 'A000007'], // 集合 1: 7人
  '2': ['A000008', 'A000009', 'A000010', 'A000011', 'A000012', 'A000013'],             // 集合 2: 6人
}

/** card_detail "集合 N" / "集合N" / "団体 N" に対応する membership member_id 集合を返す */
export function getGroupShotMembersForCardDetail(cardDetail?: string | null): Set<string> | null {
  if (!cardDetail) return null
  const m = cardDetail.match(/(?:集合|団体)\s*([0-9])\b/)
  if (!m) return null
  const ids = GROUP_SHOT_SPLITS[m[1]]
  return ids ? new Set(ids) : null
}

/** 指定 memberId が所属するユニットを返す (なければ null) */
export function getMemberUnit(memberId: string): SeventeenUnit | null {
  for (const [unit, members] of Object.entries(SEVENTEEN_UNITS)) {
    if ((members as readonly string[]).includes(memberId)) return unit as SeventeenUnit
  }
  return null
}

/** 指定 memberId と同じユニットの「ユニット共通カード」の代表 member_id (リーダー) を返す */
export function getUnitLeaderForMember(memberId: string): string | null {
  const unit = getMemberUnit(memberId)
  return unit ? UNIT_LEADERS[unit] : null
}

/** カードがユニット共通カードかどうか (card_detail で判定) */
export function isUnitSharedCard(cardDetail?: string | null): boolean {
  if (!cardDetail) return false
  const d = cardDetail.toUpperCase()
  if (d.includes('M∞CARD') || d.includes('MCARD')) return true
  // ユニット名キーワード (英/和)
  if (d.includes('HIPHOP') || d.includes('HIP HOP') || d.includes('HIP-HOP')) return true
  if (d.includes('PERFORMANCE') || d.includes('PERFOMANCE')) return true
  if (d.includes('VOCAL')) return true
  // 日本語略称
  if (cardDetail.includes('ヒポチ') || cardDetail.includes('ヒップホップ')) return true
  if (cardDetail.includes('パフォチ') || cardDetail.includes('パフォーマンス')) return true
  if (cardDetail.includes('ボカチ') || cardDetail.includes('ボーカル')) return true
  return false
}

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
