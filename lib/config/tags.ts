// ============================================================
// タグ・ジャンル設定（マスタ定義）
// ============================================================

// ── スケジュールタグ ─────────────────────────────────────────
export type ScheduleTag =
  | 'LIVE'
  | 'TICKET'
  | 'CD'
  | 'LUCKY_DRAW'
  | 'POPUP'
  | 'MERCH'
  | 'RELEASE'
  | 'BIRTHDAY'
  | 'MAGAZINE'
  | 'EVENT'
  | 'TV'
  | 'YOUTUBE'
  | 'RADIO'
  | 'LIVEVIEWING'

export const scheduleTagConfig: Record<ScheduleTag, { label: string; icon: string; color: string; bg: string }> = {
  LIVE:       { label: 'LIVE',       icon: '🎤', color: '#F3B4E3', bg: 'rgba(243,180,227,0.15)' },
  TICKET:     { label: 'TICKET',     icon: '🎫', color: '#FCD34D', bg: 'rgba(252,211,77,0.15)'  },
  CD:         { label: 'ALBUM',      icon: '💿', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  LUCKY_DRAW: { label: 'LUCKY DRAW', icon: '🂠', color: '#E879F9', bg: 'rgba(232,121,249,0.15)' },
  POPUP:      { label: 'POPUP',      icon: '🏪', color: '#FB923C', bg: 'rgba(251,146,60,0.15)'  },
  MERCH:      { label: 'MERCH',      icon: '🛒', color: '#34D399', bg: 'rgba(52,211,153,0.15)'  },
  RELEASE:    { label: 'ALBUM',      icon: '💿', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  BIRTHDAY:   { label: 'BIRTHDAY',   icon: '🎂', color: '#FB923C', bg: 'rgba(251,146,60,0.15)'  },
  MAGAZINE:   { label: 'MAGAZINE',   icon: '📖', color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
  EVENT:      { label: 'EVENT',      icon: '❤️', color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
  TV:         { label: 'TV',         icon: '📺', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)'  },
  YOUTUBE:    { label: 'YOUTUBE',    icon: '▶️', color: '#EF4444', bg: 'rgba(239,68,68,0.15)'   },
  RADIO:       { label: 'RADIO',     icon: '📻', color: '#4ADE80', bg: 'rgba(74,222,128,0.15)'  },
  LIVEVIEWING: { label: 'LIVE VIEWING/CINEMA', icon: '🎬', color: '#818CF8', bg: 'rgba(129,140,248,0.15)' },
}

// DB → アプリのタグ変換マップ（Glideデータ移行用）
export const dbTagToScheduleTag: Record<string, ScheduleTag> = {
  'LIVE':       'LIVE',
  'TICKET':     'TICKET',
  'CD':         'CD',
  'LUCKY DRAW': 'LUCKY_DRAW',
  'POPUP':      'POPUP',
  'MERCH':      'MERCH',
  'RELEASE':    'RELEASE',
  '誕生日':      'BIRTHDAY',
  '雑誌':        'MAGAZINE',
  'EVENT':      'EVENT',
  'TV':         'TV',
  'YOUTUBE':    'YOUTUBE',
  'RADIO':        'RADIO',
  'LIVEVIEWING':  'LIVEVIEWING',
  'LIVE VIEWING': 'LIVEVIEWING',
}

// ── スポットジャンル ─────────────────────────────────────────
export type SpotGenre = 'CAFE' | 'RESTAURANT' | 'FASHION' | 'ENTERTAINMENT' | 'MUSIC' | 'OTHER'

export const spotGenreConfig: Record<SpotGenre, { label: string; icon: string; color: string; bg: string }> = {
  CAFE:          { label: 'カフェ',       icon: '☕', color: '#FCD34D', bg: 'rgba(252,211,77,0.15)'  },
  RESTAURANT:    { label: 'グルメ',       icon: '🍜', color: '#FB923C', bg: 'rgba(251,146,60,0.15)'  },
  FASHION:       { label: 'ファッション', icon: '👗', color: '#F3B4E3', bg: 'rgba(243,180,227,0.15)' },
  ENTERTAINMENT: { label: 'エンタメ',     icon: '🎭', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  MUSIC:         { label: '音楽',         icon: '🎵', color: '#34D399', bg: 'rgba(52,211,153,0.15)'  },
  OTHER:         { label: 'その他',       icon: '📍', color: '#9A9A9F', bg: 'rgba(154,154,159,0.15)' },
}

// ── スポット承認ステータス ────────────────────────────────────
export type ContentStatus = 'pending' | 'confirmed' | 'rejected'
export const APPROVAL_THRESHOLD = 3  // 承認に必要な票数

// ── アーティストレベル ───────────────────────────────────────
export type ArtistLevel = 'GROUP' | 'MEMBER' | 'UNIT'
export type ArtistType = 'K-POP' | 'J-POP'

// ── プラットフォーム ─────────────────────────────────────────
export type SpotPlatform = 'instagram' | 'weverse' | 'x' | 'youtube' | 'other'

export const platformConfig: Record<SpotPlatform, { label: string; color: string; icon: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C', icon: '📸' },
  weverse:   { label: 'Weverse',   color: '#02D1AC', icon: '🎵' },
  x:         { label: 'X',         color: '#1C1C1E', icon: '𝕏' },
  youtube:   { label: 'YouTube',   color: '#FF0000', icon: '▶️' },
  other:     { label: 'その他',    color: '#636366', icon: '🔗' },
}
