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

export type SeatInfo = {
  block: string
  row: string
  seat: string
}

export type LiveEvent = {
  id: string
  title: string
  date: string
  time: string
  venue: string
  city: string
  tags: TagType[]
  isPaid: boolean
  seatRegistration?: SeatInfo
}

export const liveEvents: LiveEvent[] = [
  {
    id: 'svt-tv-1',
    title: 'SEVENTEEN — Inkigayo Special Stage',
    date: '2026-04-06',
    time: '12:10',
    venue: 'SBS Prism Tower',
    city: 'Seoul, KR',
    tags: ['TV'],
    isPaid: false,
  },
  {
    id: 'svt-youtube-1',
    title: 'SVT CLUB EP.12',
    date: '2026-04-08',
    time: '20:00',
    venue: '',
    city: '',
    tags: ['YOUTUBE'],
    isPaid: false,
  },
  {
    id: 'svt-live-1',
    title: "SEVENTEEN TOUR 'ODE TO YOU' — Seoul",
    date: '2026-04-10',
    time: '18:00',
    venue: 'KSPO DOME',
    city: 'Seoul, KR',
    tags: ['LIVE', 'TICKET'],
    isPaid: false,
  },
  {
    id: 'svt-cd-1',
    title: "SEVENTEEN — 'SPILL THE FEELS' Release",
    date: '2026-04-15',
    time: '00:00',
    venue: '',
    city: '',
    tags: ['CD', 'LUCKYDRAW'],
    isPaid: false,
  },
  {
    id: 'svt-event-1',
    title: "SEVENTEEN FAN MEETING 'CARATLAND 2026'",
    date: '2026-04-20',
    time: '15:00',
    venue: 'COEX Hall',
    city: 'Seoul, KR',
    tags: ['EVENT', 'TICKET'],
    isPaid: false,
  },
  {
    id: 'svt-live-2',
    title: 'SEVENTEEN WORLD TOUR 2026 — Tokyo Day 1',
    date: '2026-05-01',
    time: '18:30',
    venue: 'Tokyo Dome',
    city: 'Tokyo, JP',
    tags: ['LIVE', 'TICKET'],
    isPaid: false,
  },
  {
    id: 'svt-radio-1',
    title: "SEVENTEEN's Carat Land Radio",
    date: '2026-05-03',
    time: '22:00',
    venue: '',
    city: '',
    tags: ['RADIO'],
    isPaid: false,
  },
]

export type CardType = 'normal' | 'rare' | 'ur' | 'sp'

export type TradingCard = {
  id: string
  member: string
  series: string
  cardNo: string
  type: CardType
  isPaid: boolean
}

export const cardTypeConfig: Record<CardType, { label: string; color: string; bg: string }> = {
  normal: { label: 'NORMAL', color: '#9A9A9F', bg: 'rgba(154,154,159,0.15)' },
  rare:   { label: 'RARE',   color: '#60A5FA', bg: 'rgba(96,165,250,0.15)'  },
  ur:     { label: 'UR',     color: '#F3B4E3', bg: 'rgba(243,180,227,0.15)' },
  sp:     { label: 'SP',     color: '#FCD34D', bg: 'rgba(252,211,77,0.15)'  },
}

export const seventeenMembers = [
  { id: 'scoups',   name: "S.Coups",  color: '#3B82F6', photo: '/scoups.jpg'   },
  { id: 'jeonghan', name: 'Jeonghan', color: '#8B5CF6', photo: '/jeonghan.jpg' },
  { id: 'joshua',   name: 'Joshua',   color: '#06B6D4', photo: undefined       },
  { id: 'jun',      name: 'Jun',      color: '#10B981', photo: undefined       },
  { id: 'hoshi',    name: 'Hoshi',    color: '#F59E0B', photo: '/hoshi.jpg'    },
  { id: 'wonwoo',   name: 'Wonwoo',   color: '#6366F1', photo: '/wonwoo.jpg'   },
  { id: 'woozi',    name: 'Woozi',    color: '#EC4899', photo: '/woozi.jpg'    },
  { id: 'dk',       name: 'DK',       color: '#F97316', photo: '/dk.jpg'       },
  { id: 'mingyu',   name: 'Mingyu',   color: '#14B8A6', photo: '/mingyu.jpg'   },
  { id: 'the8',     name: 'The8',     color: '#84CC16', photo: undefined       },
  { id: 'seungkwan',name: 'Seungkwan',color: '#EF4444', photo: '/seungkwan.jpg'},
  { id: 'vernon',   name: 'Vernon',   color: '#A78BFA', photo: '/vernon.jpg'   },
  { id: 'dino',     name: 'Dino',     color: '#FB923C', photo: '/dino.jpg'     },
]

export const tradingCards: TradingCard[] = [
  { id: 'tc-01', member: "S.Coups",   series: 'SPILL THE FEELS', cardNo: '01/13', type: 'normal', isPaid: false },
  { id: 'tc-02', member: 'Jeonghan',  series: 'SPILL THE FEELS', cardNo: '02/13', type: 'normal', isPaid: false },
  { id: 'tc-03', member: 'Joshua',    series: 'SPILL THE FEELS', cardNo: '03/13', type: 'rare',   isPaid: false },
  { id: 'tc-04', member: 'Jun',       series: 'SPILL THE FEELS', cardNo: '04/13', type: 'normal', isPaid: false },
  { id: 'tc-05', member: 'Hoshi',     series: 'SPILL THE FEELS', cardNo: '05/13', type: 'ur',     isPaid: false },
  { id: 'tc-06', member: 'Wonwoo',    series: 'SPILL THE FEELS', cardNo: '06/13', type: 'normal', isPaid: false },
  { id: 'tc-07', member: 'Woozi',     series: 'SPILL THE FEELS', cardNo: '07/13', type: 'rare',   isPaid: false },
  { id: 'tc-08', member: 'DK',        series: 'SPILL THE FEELS', cardNo: '08/13', type: 'normal', isPaid: false },
  { id: 'tc-09', member: 'Mingyu',    series: 'SPILL THE FEELS', cardNo: '09/13', type: 'sp',     isPaid: false },
  { id: 'tc-10', member: 'The8',      series: 'SPILL THE FEELS', cardNo: '10/13', type: 'normal', isPaid: false },
  { id: 'tc-11', member: 'Seungkwan', series: 'SPILL THE FEELS', cardNo: '11/13', type: 'rare',   isPaid: false },
  { id: 'tc-12', member: 'Vernon',    series: 'SPILL THE FEELS', cardNo: '12/13', type: 'ur',     isPaid: false },
  { id: 'tc-13', member: 'Dino',      series: 'SPILL THE FEELS', cardNo: '13/13', type: 'normal', isPaid: false },
  { id: 'tc-14', member: "S.Coups",   series: 'ODE TO YOU',      cardNo: '01/13', type: 'sp',     isPaid: false },
  { id: 'tc-15', member: 'Jeonghan',  series: 'ODE TO YOU',      cardNo: '02/13', type: 'ur',     isPaid: false },
  { id: 'tc-16', member: 'Joshua',    series: 'ODE TO YOU',      cardNo: '03/13', type: 'normal', isPaid: false },
  { id: 'tc-17', member: 'Hoshi',     series: 'ODE TO YOU',      cardNo: '05/13', type: 'rare',   isPaid: false },
  { id: 'tc-18', member: 'Mingyu',    series: 'ODE TO YOU',      cardNo: '09/13', type: 'normal', isPaid: false },
]

export type EventType = 'concert' | 'fanmeet' | 'release' | 'broadcast' | 'birthday' | 'variety'

export type Event = {
  id: string
  type: EventType
  artist: string
  artistColor: string
  title: string
  date: string     // YYYY-MM-DD（開始日）
  dateEnd?: string  // YYYY-MM-DD（終了日）期間イベントのみ
  time: string      // HH:MM（開始時間）
  timeEnd?: string  // HH:MM（終了時間）期間イベントのみ
  venue?: string
  city?: string
  isFollowing?: boolean
  tags?: TagType[]
  image?: string   // イベント画像 URL
  sourceUrl?: string
  sourceName?: string
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
  imageUrl?: string       // undefined → グラデーションプレースホルダー
  sourceUrl?: string      // タップで飛ぶURL (Instagram/Weverse/X)
  platform?: SpotPlatform
  tags: string[]          // ['SEVENTEEN', 'DK'] など
  contributor: string     // 投稿者名
  date: string            // YYYY-MM-DD 来店日
  caption?: string
  votes: number                    // 承認票数 (0→ pending, >=3 → confirmed)
  status: 'pending' | 'confirmed'  // votes >= 3 で自動確定
}

export type PilgrimageSpot = {
  id: string
  name: string        // アプリ表示名（日本語）
  nameLocal: string   // 現地語名（タクシー等に見せる用）
  address: string     // 現地語住所
  city: string
  genre: SpotGenre
  members: string[]
  description: string
  lat: number
  lng: number
  officialUrl?: string  // 公式HP
  sourceUrl?: string
  sourceName?: string
  photos?: SpotPhoto[]  // シード写真（公式・キュレーション済み）
  contributor?: string  // 投稿者ニックネーム（ユーザー投稿スポットのみ）
}

/** スポットが「情報完備」かどうか（ピンの色判定用） */
export function isSpotComplete(spot: PilgrimageSpot, confirmedUserPhotoCount: number): boolean {
  const seedCount = spot.photos?.length ?? 0
  return (seedCount + confirmedUserPhotoCount) > 0
}

/** 韓国 → NAVER MAP / 日本 → Google Maps */
export function getMapUrl(spot: PilgrimageSpot): string {
  const isKorea = spot.city === 'Seoul' || spot.city === 'Busan' || spot.city === 'Incheon'
  const q = encodeURIComponent(spot.nameLocal || spot.name)
  if (isKorea) {
    return `https://map.naver.com/v5/search/${q}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${q}+${spot.lat},${spot.lng}`
}

export function getMapAppName(spot: PilgrimageSpot): string {
  const isKorea = spot.city === 'Seoul' || spot.city === 'Busan'
  return isKorea ? 'NAVER MAP' : 'マップで開く'
}

export const pilgrimageSpots: PilgrimageSpot[] = [
  {
    id: 'SP00021',
    name: 'Mala Town (パリ)',
    nameLocal: 'Mala Town',
    address: '44 R. de Turbigo 75003 Paris',
    city: 'Paris',
    genre: 'restaurant',
    members: ['The8'],
    description: 'THE8が2026年1月に訪れたパリの麻辣料理店。Instagramで話題に。',
    lat: 48.8650, lng: 2.3549,
    sourceUrl: 'https://www.instagram.com/p/DTteDLFDHcb/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00021-1', imageUrl: 'https://lh3.googleusercontent.com/d/1r681SdnHDhiQTTNbRvFpnTRmoNXzeYXi', sourceUrl: 'https://www.instagram.com/p/DTteDLFDHcb/', platform: 'instagram', tags: ['SEVENTEEN', 'The8'], contributor: 'SEVENTEEN', date: '2026-01-20', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00022',
    name: 'Mirate (ロサンゼルス)',
    nameLocal: 'Mirate',
    address: '1712 N Vermont Ave Los Angeles CA 90027',
    city: 'Los Angeles',
    genre: 'restaurant',
    members: ['Mingyu'],
    description: 'MINGYUが2026年1月にロサンゼルス滞在中に訪れたレストラン。',
    lat: 34.1022, lng: -118.2913,
    sourceUrl: 'https://www.instagram.com/p/DTKecRCkyH8/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00022-1', imageUrl: 'https://lh3.googleusercontent.com/d/1xp0asbrED05y-1hy7gI8Hm5cxJTpHiqb', sourceUrl: 'https://www.instagram.com/p/DTKecRCkyH8/', platform: 'instagram', tags: ['SEVENTEEN', 'Mingyu'], contributor: 'SEVENTEEN', date: '2026-01-06', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00023',
    name: 'Nanno Bldg (渋谷)',
    nameLocal: 'Nanno Bldg',
    address: '東京都渋谷区神宮前3丁目18-25',
    city: 'Tokyo',
    genre: 'other',
    members: ['Joshua'],
    description: 'JOSHUAが訪れた渋谷のビル周辺。Instagramで話題に。',
    lat: 35.6702, lng: 139.7086,
    sourceUrl: 'https://www.instagram.com/p/Ck5_EqcPBLt/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00023-1', imageUrl: 'https://lh3.googleusercontent.com/d/1-Z1ji-SMJdF9lkaROzvnhSHeUnr2rN_O', sourceUrl: 'https://www.instagram.com/p/Ck5_EqcPBLt/', platform: 'instagram', tags: ['SEVENTEEN', 'Joshua'], contributor: 'SEVENTEEN', date: '2023-01-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00024',
    name: 'OVERRIDE 南堀江',
    nameLocal: 'OVERRIDE 南堀江',
    address: '〒550-0015 大阪府大阪市西区南堀江１丁目１５−４',
    city: 'Osaka',
    genre: 'fashion',
    members: ['Joshua'],
    description: 'JOSHUAが大阪で訪れたストリートファッションブランドの旗艦店。',
    lat: 34.6711, lng: 135.4955,
    sourceUrl: 'https://www.instagram.com/p/ClGkXi9vvSM/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00024-1', imageUrl: 'https://lh3.googleusercontent.com/d/1-vGlQxYJaaAN_LIqKIk10VvjjQjx--tY', sourceUrl: 'https://www.instagram.com/p/ClGkXi9vvSM/', platform: 'instagram', tags: ['SEVENTEEN', 'Joshua'], contributor: 'SEVENTEEN', date: '2023-01-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00025',
    name: 'RAMAI 千歳店',
    nameLocal: 'RAMAI 千歳店',
    address: '北海道千歳市北栄2丁目13-1',
    city: 'Sapporo',
    genre: 'restaurant',
    members: ['S.Coups'],
    description: 'S.COUPSが北海道千歳市で訪れた飲食店。Instagramで紹介。',
    lat: 42.8330, lng: 141.6450,
    sourceUrl: 'https://www.instagram.com/p/C3FmqhGRqcu/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00025-1', imageUrl: 'https://lh3.googleusercontent.com/d/1pKEZlLDYQtnjHii097V-LCcX1F0hown0', sourceUrl: 'https://www.instagram.com/p/C3FmqhGRqcu/', platform: 'instagram', tags: ['SEVENTEEN', 'S.Coups'], contributor: 'SEVENTEEN', date: '2024-02-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00026',
    name: 'Red Ananas (芝公園)',
    nameLocal: 'Red Ananas',
    address: '東京都港区芝公園2-3-27',
    city: 'Tokyo',
    genre: 'cafe',
    members: ['Joshua'],
    description: 'JOSHUAが港区芝公園で訪れたカフェ。Instagramで話題に。',
    lat: 35.6570, lng: 139.7520,
    sourceUrl: 'https://www.instagram.com/p/Csxmf2vvCs4/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00026-1', imageUrl: 'https://lh3.googleusercontent.com/d/1c03-L5Hdk5wKutF2E6GpBdFeOyd_JaOG', sourceUrl: 'https://www.instagram.com/p/Csxmf2vvCs4/', platform: 'instagram', tags: ['SEVENTEEN', 'Joshua'], contributor: 'SEVENTEEN', date: '2023-06-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00027',
    name: 'San Francisco Peaks (原宿)',
    nameLocal: 'San Francisco Peaks',
    address: '〒150-0001 東京都渋谷区神宮前３丁目２８−７',
    city: 'Tokyo',
    genre: 'cafe',
    members: ['Jun'],
    description: 'JUNが原宿で訪れたカフェ。複数回のInstagram投稿で確認されている。',
    lat: 35.6720, lng: 139.7090,
    sourceUrl: 'https://www.instagram.com/p/Cz3KhT0LzY-/',
    sourceName: 'Instagram',
    photos: [
      { id: 'SP00027-1', imageUrl: 'https://lh3.googleusercontent.com/d/1JuWZ_WKWh_lgStU9ZqrwuGETh6vRPLDs', sourceUrl: 'https://www.instagram.com/p/Cz3KhT0LzY-/', platform: 'instagram', tags: ['SEVENTEEN', 'Jun'], contributor: 'SEVENTEEN', date: '2023-11-20', votes: 3, status: 'confirmed' },
      { id: 'SP00027-2', imageUrl: 'https://lh3.googleusercontent.com/d/1mBfUk-IZQMAzYTzry7Et7SMjVoICBcPm', sourceUrl: 'https://www.instagram.com/p/Cs0yol1pgDZ/', platform: 'instagram', tags: ['SEVENTEEN', 'Jun'], contributor: 'SEVENTEEN', date: '2023-05-29', votes: 3, status: 'confirmed' },
    ],
  },
  {
    id: 'SP00034',
    name: 'Waffle cafe ORANGE (下北沢)',
    nameLocal: 'Waffle cafe ORANGE',
    address: '東京都世田谷区北沢2-29-6',
    city: 'Tokyo',
    genre: 'cafe',
    members: ['Hoshi', 'Wonwoo'],
    description: 'HOSHIとWONWOOが下北沢で訪れたワッフルカフェ。Weverseで言及。',
    lat: 35.6630, lng: 139.6670,
    sourceUrl: 'https://weverse.io/seventeen/artist/0-108448563',
    sourceName: 'Weverse',
    photos: [{ id: 'SP00034-1', imageUrl: 'https://lh3.googleusercontent.com/d/1udYGV9ECe5vBZOhMMuJKQfwYNLOKmSKp', sourceUrl: 'https://weverse.io/seventeen/artist/0-108448563', platform: 'weverse', tags: ['SEVENTEEN', 'Hoshi', 'Wonwoo'], contributor: 'SEVENTEEN', date: '2023-09-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00035',
    name: 'アレスガーデン表参道',
    nameLocal: 'アレスガーデン表参道',
    address: '〒150-0001 東京都渋谷区神宮前４丁目２８−４ アレスガーデン表参道 2F',
    city: 'Tokyo',
    genre: 'other',
    members: ['Hoshi'],
    description: 'HOSHIが訪れた表参道のビル。Instagramで紹介されたスポット。',
    lat: 35.6690, lng: 139.7070,
    sourceUrl: 'https://www.instagram.com/p/CdN7cVuvziD/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00035-1', imageUrl: 'https://lh3.googleusercontent.com/d/1YPlAC_zrzpH_w7ihsEAEWxxChUDR09kt', sourceUrl: 'https://www.instagram.com/p/CdN7cVuvziD/', platform: 'instagram', tags: ['SEVENTEEN', 'Hoshi'], contributor: 'SEVENTEEN', date: '2022-04-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00036',
    name: 'イタリア公園 (東新橋)',
    nameLocal: 'イタリア公園',
    address: '〒105-0021 東京都港区東新橋１丁目１０−２０',
    city: 'Tokyo',
    genre: 'other',
    members: ['Wonwoo'],
    description: 'WONWOOが港区東新橋で訪れたイタリア式庭園。Instagramで話題に。',
    lat: 35.6610, lng: 139.7600,
    sourceUrl: 'https://www.instagram.com/p/Csxe8TiRA9x/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00036-1', imageUrl: 'https://lh3.googleusercontent.com/d/1jgozY6agKq-AH4hxPPp5ItPZD1FMERSM', sourceUrl: 'https://www.instagram.com/p/Csxe8TiRA9x/', platform: 'instagram', tags: ['SEVENTEEN', 'Wonwoo'], contributor: 'SEVENTEEN', date: '2023-06-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00037',
    name: 'うつぼ公園 (大阪)',
    nameLocal: 'うつぼ公園',
    address: '〒550-0002 大阪府大阪市西区江戸堀１丁目２３−２０',
    city: 'Osaka',
    genre: 'other',
    members: ['DK'],
    description: 'DKが大阪市内で散策したうつぼ公園。Instagramで投稿。',
    lat: 34.6890, lng: 135.4930,
    sourceUrl: 'https://www.instagram.com/p/C7I9CQfR8Hm/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00037-1', imageUrl: 'https://lh3.googleusercontent.com/d/13fBmPzn6zQDF-P9Z5E_SWCfEH2I16uQw', sourceUrl: 'https://www.instagram.com/p/C7I9CQfR8Hm/', platform: 'instagram', tags: ['SEVENTEEN', 'DK'], contributor: 'SEVENTEEN', date: '2024-05-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00038',
    name: 'お好み焼き 金のてこ (大阪)',
    nameLocal: 'お好み焼き 金のてこ',
    address: '〒543-0052 大阪府大阪市天王寺区大道４丁目１−5',
    city: 'Osaka',
    genre: 'restaurant',
    members: ['DK'],
    description: 'DKが大阪で複数回訪れたお好み焼き店。Weverseでもおすすめとして紹介。',
    lat: 34.6500, lng: 135.5220,
    sourceUrl: 'https://weverse.io/seventeen/artist/2-167394932',
    sourceName: 'Weverse',
    photos: [
      { id: 'SP00038-1', imageUrl: 'https://lh3.googleusercontent.com/d/1gnhCEtsq5Axqh9wS0OFpPt-nPKWJCcDE', sourceUrl: 'https://weverse.io/seventeen/artist/2-167394932', platform: 'weverse', tags: ['SEVENTEEN', 'DK'], contributor: 'SEVENTEEN', date: '2025-12-07', votes: 3, status: 'confirmed' },
      { id: 'SP00038-2', imageUrl: 'https://lh3.googleusercontent.com/d/1JZpp7YGxHte9LM9Sr9fjlyJSoIrqvPKV', sourceUrl: 'https://weverse.io/seventeen/artist/2-167394932', platform: 'weverse', tags: ['SEVENTEEN', 'DK'], contributor: 'SEVENTEEN', date: '2025-12-07', votes: 3, status: 'confirmed' },
      { id: 'SP00038-3', imageUrl: 'https://lh3.googleusercontent.com/d/1fI8bYaB8mSBWedMXb0ZGm5qCvZ8lNrUc', sourceUrl: 'https://weverse.io/seventeen/artist/2-167394932', platform: 'weverse', tags: ['SEVENTEEN', 'DK'], contributor: 'SEVENTEEN', date: '2025-12-07', votes: 3, status: 'confirmed' },
    ],
  },
  {
    id: 'SP00039',
    name: 'カスケードガーデン (大阪)',
    nameLocal: 'カスケードガーデン',
    address: '大阪府大阪市北区天満橋１丁目８',
    city: 'Osaka',
    genre: 'other',
    members: ['DK'],
    description: 'DKが大阪北区で撮影したカスケードガーデン。Instagramで投稿。',
    lat: 34.7030, lng: 135.5180,
    sourceUrl: 'https://www.instagram.com/p/CsSvxRPxitr/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00039-1', imageUrl: 'https://lh3.googleusercontent.com/d/1QHBRW0THqQh20D9ujY8I-HSjWrSnUOIl', sourceUrl: 'https://www.instagram.com/p/CsSvxRPxitr/', platform: 'instagram', tags: ['SEVENTEEN', 'DK'], contributor: 'SEVENTEEN', date: '2023-06-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00040',
    name: 'かつ吉 渋谷店',
    nameLocal: 'かつ吉 渋谷店',
    address: '〒150-0002 東京都渋谷区渋谷３丁目９−１０ Kdc渋谷ビル B1F',
    city: 'Tokyo',
    genre: 'restaurant',
    members: ['Jeonghan'],
    description: 'JEONGHANが渋谷で訪れたとんかつ・割烹料理店。Instagramで話題に。',
    lat: 35.6570, lng: 139.7050,
    sourceUrl: 'https://www.instagram.com/p/C7f05cphL2e/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00040-1', imageUrl: 'https://lh3.googleusercontent.com/d/1yxtNRVETB_HvE4CGdAJt4q7EBHGDjKVK', sourceUrl: 'https://www.instagram.com/p/C7f05cphL2e/', platform: 'instagram', tags: ['SEVENTEEN', 'Jeonghan'], contributor: 'SEVENTEEN', date: '2024-06-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00041',
    name: 'クロムハーツ原宿店',
    nameLocal: 'Chrome Hearts 原宿',
    address: '東京都渋谷区神宮前6-7-4',
    city: 'Tokyo',
    genre: 'fashion',
    members: ['Jun'],
    description: 'JUNが原宿のクロムハーツ旗艦店を訪問。Instagramで投稿。',
    lat: 35.6660, lng: 139.7050,
    sourceUrl: 'https://www.instagram.com/p/Cs6G1geJyZW/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00041-1', imageUrl: 'https://lh3.googleusercontent.com/d/1ZKGcGRYe_eLhqxZOFrtiG5LMrLKRfijF', sourceUrl: 'https://www.instagram.com/p/Cs6G1geJyZW/', platform: 'instagram', tags: ['SEVENTEEN', 'Jun'], contributor: 'SEVENTEEN', date: '2023-06-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00042',
    name: 'コスモ麻布十番 前',
    nameLocal: 'コスモ麻布十番',
    address: '〒106-0045 東京都港区麻布十番３丁目３−１２ コスモ麻布十番',
    city: 'Tokyo',
    genre: 'other',
    members: ['Jeonghan'],
    description: 'JEONGHANが麻布十番で撮影したスポット。Instagramで話題に。',
    lat: 35.6540, lng: 139.7360,
    sourceUrl: 'https://www.instagram.com/p/Ck0id1XL6Zi/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00042-1', imageUrl: 'https://lh3.googleusercontent.com/d/1qgyeD_lIi2c-uZaPpYqEsuIrSLWn2mSH', sourceUrl: 'https://www.instagram.com/p/Ck0id1XL6Zi/', platform: 'instagram', tags: ['SEVENTEEN', 'Jeonghan'], contributor: 'SEVENTEEN', date: '2022-12-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00043',
    name: 'ザ・フェニックスホール (大阪)',
    nameLocal: 'ザ・フェニックスホール',
    address: '大阪府大阪市北区南森町1-4-3',
    city: 'Osaka',
    genre: 'entertainment',
    members: ['Seungkwan'],
    description: 'SEUNGKWANが大阪公演後に立ち寄ったと話題のホール。Instagramで投稿。',
    lat: 34.6970, lng: 135.5100,
    sourceUrl: 'https://www.instagram.com/p/C1J8FswSnGx/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00043-1', imageUrl: 'https://lh3.googleusercontent.com/d/1YAeP1UF4yb-13mqeTneUW9q1fAkhPZ9w', sourceUrl: 'https://www.instagram.com/p/C1J8FswSnGx/', platform: 'instagram', tags: ['SEVENTEEN', 'Seungkwan'], contributor: 'SEVENTEEN', date: '2024-01-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00044',
    name: 'ジャンボ釣船 つり吉 大阪新世界店',
    nameLocal: 'ジャンボ釣船 つり吉 大阪新世界店',
    address: '〒556-0002 大阪府大阪市浪速区恵美須東2-3-14',
    city: 'Osaka',
    genre: 'entertainment',
    members: ['Jeonghan'],
    description: 'JEONGHANが大阪新世界で訪れた釣り船居酒屋。Instagramで話題に。',
    lat: 34.6520, lng: 135.5060,
    sourceUrl: 'https://www.instagram.com/p/ClGq2WABTU_/',
    sourceName: 'Instagram',
    photos: [
      { id: 'SP00044-1', imageUrl: 'https://lh3.googleusercontent.com/d/1J3Q3hkiHdrCNSgwMOGEux1m1XITEn--W', sourceUrl: 'https://www.instagram.com/p/ClGq2WABTU_/', platform: 'instagram', tags: ['SEVENTEEN', 'Jeonghan'], contributor: 'SEVENTEEN', date: '2024-08-01', votes: 3, status: 'confirmed' },
      { id: 'SP00044-2', imageUrl: 'https://lh3.googleusercontent.com/d/1N1xMi_IiuW9LlgrLcN_bj5-1wgkjpsQQ', sourceUrl: 'https://www.instagram.com/p/ClGq2WABTU_/', platform: 'instagram', tags: ['SEVENTEEN', 'Jeonghan'], contributor: 'SEVENTEEN', date: '2024-08-01', votes: 3, status: 'confirmed' },
    ],
  },
  {
    id: 'SP00045',
    name: 'シュー・アンド・シューカンパニー',
    nameLocal: 'Shoe & Shoe Company',
    address: '〒106-0045 東京都港区麻布十番３丁目２−６ ライオンズマンション麻布十番第３ 1F',
    city: 'Tokyo',
    genre: 'fashion',
    members: ['Jeonghan'],
    description: 'JEONGHANが麻布十番で訪れたシューズショップ。Instagramで投稿。',
    lat: 35.6530, lng: 139.7360,
    sourceUrl: 'https://www.instagram.com/p/Ck9_8lRrCDC/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00045-1', imageUrl: 'https://lh3.googleusercontent.com/d/1xdB8kyENkH4rOQAc-62WzQi3g2p-A_Ig', sourceUrl: 'https://www.instagram.com/p/Ck9_8lRrCDC/', platform: 'instagram', tags: ['SEVENTEEN', 'Jeonghan'], contributor: 'SEVENTEEN', date: '2022-12-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00047',
    name: 'セブンイレブン大阪中野町4丁目店',
    nameLocal: 'セブンイレブン大阪中野町4丁目店',
    address: '大阪府大阪市東成区中道4丁目',
    city: 'Osaka',
    genre: 'other',
    members: ['DK', 'Hoshi'],
    description: 'DKとHOSHIが立ち寄ったと言われるコンビニ。ファン目撃情報で話題に。',
    lat: 34.6760, lng: 135.5380,
    sourceUrl: 'https://www.instagram.com/p/CsSvxRPxitr/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00047-1', imageUrl: 'https://lh3.googleusercontent.com/d/1Aj-GduNJ4JJ5qjHlagw-Qdij_SfeINmw', sourceUrl: 'https://www.instagram.com/p/CsSvxRPxitr/', platform: 'instagram', tags: ['SEVENTEEN', 'DK', 'Hoshi'], contributor: 'SEVENTEEN', date: '2023-06-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00048',
    name: 'そば處 とき (大阪堂島)',
    nameLocal: 'そば處 とき',
    address: '〒530-0003 大阪府大阪市北区堂島１丁目３−4 谷安ビル 1F',
    city: 'Osaka',
    genre: 'restaurant',
    members: ['Hoshi'],
    description: 'HOSHIが大阪堂島で訪れた老舗そば屋。Instagramで紹介。',
    lat: 34.6960, lng: 135.4980,
    sourceUrl: 'https://www.instagram.com/p/DJJ3ReAPsC6/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00048-1', imageUrl: 'https://lh3.googleusercontent.com/d/1lV7Ykps47lbP6F033WoMw2OeHokYSrc0', sourceUrl: 'https://www.instagram.com/p/DJJ3ReAPsC6/', platform: 'instagram', tags: ['SEVENTEEN', 'Hoshi'], contributor: 'SEVENTEEN', date: '2025-04-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00049',
    name: 'タイトーステーション BIGFUN平和島店',
    nameLocal: 'タイトーステーション BIGFUN平和島店',
    address: 'Japan 〒143-0006 東京都大田区平和島1-1-1 BIGFUN平和島 3F',
    city: 'Tokyo',
    genre: 'entertainment',
    members: ['S.Coups'],
    description: 'S.COUPSがWeverseで紹介したゲームセンター。平和島のBIGFUN内。',
    lat: 35.5840, lng: 139.7410,
    sourceUrl: 'https://weverse.io/seventeen/artist/3-219652165',
    sourceName: 'Weverse',
    photos: [{ id: 'SP00049-1', imageUrl: 'https://drive.google.com/uc?export=view&id=17Q4H6H-ZQqDw5yxcVE4gZJ05Y2Vy8L-T', sourceUrl: 'https://weverse.io/seventeen/artist/3-219652165', platform: 'weverse', tags: ['SEVENTEEN', 'S.Coups'], contributor: 'SEVENTEEN', date: '2024-01-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00050',
    name: 'とんかつ 檍 大門店',
    nameLocal: 'とんかつ 檍 大門店',
    address: '東京都港区浜松町１丁目１１−１２',
    city: 'Tokyo',
    genre: 'restaurant',
    members: ['Seungkwan'],
    description: 'SEUNGKWANが港区大門で訪れたとんかつの名店。X（Twitter）で話題に。',
    lat: 35.6590, lng: 139.7560,
    sourceUrl: 'https://twitter.com/pledis_17/status/1592843380895395842',
    sourceName: 'X (Twitter)',
    photos: [{ id: 'SP00050-1', imageUrl: 'https://lh3.googleusercontent.com/d/1wKWtqIi3DgWD9r45tk7IZ5FgCnJxMwYW', sourceUrl: 'https://twitter.com/pledis_17/status/1592843380895395842', platform: 'x', tags: ['SEVENTEEN', 'Seungkwan'], contributor: 'SEVENTEEN', date: '2022-11-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00051',
    name: 'ドンキホーテ 六本木店',
    nameLocal: 'ドン・キホーテ 六本木店',
    address: '東京都港区六本木7-13-8',
    city: 'Tokyo',
    genre: 'other',
    members: ['Mingyu'],
    description: 'MINGYUが六本木のドン・キホーテを訪問。Instagramで投稿。',
    lat: 35.6640, lng: 139.7300,
    sourceUrl: 'https://www.instagram.com/p/Cs6EmEHRKS3/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00051-1', imageUrl: 'https://lh3.googleusercontent.com/d/1Pjq-JFRLz6TjU2aHecbSm5b-r2bxwgXE', sourceUrl: 'https://www.instagram.com/p/Cs6EmEHRKS3/', platform: 'instagram', tags: ['SEVENTEEN', 'Mingyu'], contributor: 'SEVENTEEN', date: '2023-06-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00052',
    name: 'ブーランジェリーカワ 東天満店',
    nameLocal: 'ブーランジェリーカワ 東天満店',
    address: '大阪市北区東天満1丁目 2-1 エルヴェ東天満1F',
    city: 'Osaka',
    genre: 'cafe',
    members: ['Jun'],
    description: 'JUNが大阪東天満で訪れたパン屋・ベーカリーカフェ。Instagramで投稿。',
    lat: 34.6970, lng: 135.5180,
    sourceUrl: 'https://www.instagram.com/p/CsQeANorEn_/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00052-1', imageUrl: 'https://lh3.googleusercontent.com/d/1I3BeoOoq9pXJEBG3WKeGYrM1m4RkMoyb', sourceUrl: 'https://www.instagram.com/p/CsQeANorEn_/', platform: 'instagram', tags: ['SEVENTEEN', 'Jun'], contributor: 'SEVENTEEN', date: '2023-06-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00131',
    name: 'Common Era (ソウル梨泰院)',
    nameLocal: 'Common Era 이태원',
    address: '서울 용산구 이태원로 251 4층',
    city: 'Seoul',
    genre: 'fashion',
    members: ['ALL'],
    description: 'SEVENTEENのメンバー多数が目撃されたソウル梨泰院のファッションブランド。',
    lat: 37.5370, lng: 127.0000,
    sourceUrl: 'https://www.instagram.com/p/DS7g20HE3yM/',
    sourceName: 'Instagram',
    photos: [
      { id: 'SP00131-1', imageUrl: 'https://lh3.googleusercontent.com/d/1SYPBYZwivI0mJyhfeW8YxzPXueM3Y8yU', sourceUrl: 'https://www.instagram.com/p/DS7g20HE3yM/', platform: 'instagram', tags: ['SEVENTEEN', 'S.COUPS'], contributor: 'SEVENTEEN', date: '2026-12-31', votes: 3, status: 'confirmed' },
      { id: 'SP00131-2', imageUrl: 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Y4MLVNoj457bmHx5ALYe/pub/cKO6xinoGqikmkh43CkT.jpeg', sourceUrl: 'https://www.instagram.com/p/DS7g20HE3yM/', platform: 'instagram', tags: ['SEVENTEEN'], contributor: 'SEVENTEEN', date: '2026-12-31', votes: 3, status: 'confirmed' },
    ],
  },
  {
    id: 'SP00161',
    name: 'すし家 祥太 (麻布十番)',
    nameLocal: 'すし家 祥太',
    address: '東京都港区麻布十番3-3-10 LANIビルII 1F',
    city: 'Tokyo',
    genre: 'restaurant',
    members: ['DK'],
    description: 'DKが麻布十番で訪れた寿司店。Instagramで話題に。',
    lat: 35.6540, lng: 139.7360,
    sourceUrl: 'https://www.instagram.com/p/CkyHa1mJ7d_/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00161-1', imageUrl: 'https://lh3.googleusercontent.com/d/1RUnNd9oU3kt4bbcJf8E8sbtqgbcG2dMb', sourceUrl: 'https://www.instagram.com/p/CkyHa1mJ7d_/', platform: 'instagram', tags: ['SEVENTEEN', 'DK'], contributor: 'SEVENTEEN', date: '2022-12-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00267',
    name: 'Courage Bagels (ロサンゼルス)',
    nameLocal: 'Courage Bagels',
    address: '777 Virgil Ave Los Angeles CA 90029',
    city: 'Los Angeles',
    genre: 'cafe',
    members: ['Mingyu'],
    description: 'MINGYUがロサンゼルス滞在中に訪れた人気ベーグルショップ。',
    lat: 34.0860, lng: -118.2870,
    sourceUrl: 'https://www.instagram.com/p/DTNGICyk67G/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00267-1', imageUrl: 'https://lh3.googleusercontent.com/d/1Xgq03GvL_zRRhfFU43pSnxGw_zhau6To', sourceUrl: 'https://www.instagram.com/p/DTNGICyk67G/', platform: 'instagram', tags: ['SEVENTEEN', 'Mingyu'], contributor: 'SEVENTEEN', date: '2026-01-06', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00270',
    name: "Sotheby's Maison 香港",
    nameLocal: "Sotheby's Maison Hong Kong",
    address: 'Landmark Chater, 8 Connaught Road Central, Central, Hong Kong',
    city: 'Hong Kong',
    genre: 'entertainment',
    members: ['The8'],
    description: 'THE8が香港で訪れた有名オークションハウス。Instagramで投稿。',
    lat: 22.2820, lng: 114.1580,
    sourceUrl: 'https://www.instagram.com/p/DWbOdkakSJs/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00270-1', imageUrl: 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/D6BDssCcVQEOYht5eTiZ/pub/hueRUVhZF49AzC2KQvwU.jpeg', sourceUrl: 'https://www.instagram.com/p/DWbOdkakSJs/', platform: 'instagram', tags: ['SEVENTEEN', 'The8'], contributor: 'SEVENTEEN', date: '2025-05-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00274',
    name: '선경중화요리 (파주)',
    nameLocal: '선경중화요리',
    address: '경기 파주시 조리읍 통일로 331 1층',
    city: 'Seoul',
    genre: 'restaurant',
    members: ['S.Coups', 'Joshua', 'Jun', 'The8', 'Mingyu', 'DK', 'Seungkwan', 'Vernon', 'Dino'],
    description: 'S.COUPS・JOSHUA・JUN・THE8・MINGYU・DK・SEUNGKWAN・VERNON・DINOが一緒に訪れた中華料理店。YouTubeで話題に。',
    lat: 37.7440, lng: 126.8080,
    sourceUrl: 'https://youtu.be/TJWUc875kpU',
    sourceName: 'YouTube',
    photos: [{ id: 'SP00274-1', imageUrl: 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/D6BDssCcVQEOYht5eTiZ/pub/KW2hmeWSxWTorlWBi972.jpeg', sourceUrl: 'https://youtu.be/TJWUc875kpU', platform: 'other', tags: ['SEVENTEEN'], contributor: 'SEVENTEEN', date: '2025-01-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00275',
    name: 'さぬき家 (パリ)',
    nameLocal: 'さぬき家',
    address: '9 Rue d\'Argenteuil, 75001 Paris, France',
    city: 'Paris',
    genre: 'restaurant',
    members: ['Jeonghan'],
    description: 'JEONGHANがパリ滞在中に訪れた日本料理店（さぬきうどん）。',
    lat: 48.8650, lng: 2.3340,
    sourceUrl: 'https://www.facebook.com/sanukiyaparis',
    sourceName: 'Facebook',
    photos: [{ id: 'SP00275-1', imageUrl: 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/D6BDssCcVQEOYht5eTiZ/pub/Drnu4eE5l65LqkDRMRtV.jpeg', sourceUrl: 'https://www.facebook.com/sanukiyaparis', platform: 'other', tags: ['SEVENTEEN', 'Jeonghan'], contributor: 'SEVENTEEN', date: '2025-01-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00276',
    name: '루미에르퍼퓸 성수 (ソウル)',
    nameLocal: '향수공방 루미에르퍼퓸 성수',
    address: '서울 성동구 성수동2가 315-56',
    city: 'Seoul',
    genre: 'other',
    members: ['Wonwoo'],
    description: 'WONWOOが聖水洞で訪れた香水工房。YouTubeで紹介されたスポット。',
    lat: 37.5430, lng: 127.0550,
    sourceUrl: 'https://youtu.be/pK-xYC8OS8o',
    sourceName: 'YouTube',
    photos: [{ id: 'SP00276-1', imageUrl: 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/D6BDssCcVQEOYht5eTiZ/pub/iGzcBCE0Gji2MTfv96WG.jpeg', sourceUrl: 'https://youtu.be/pK-xYC8OS8o', platform: 'other', tags: ['SEVENTEEN', 'Wonwoo'], contributor: 'SEVENTEEN', date: '2025-01-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00277',
    name: 'winks (沖縄)',
    nameLocal: 'winks',
    address: '沖縄県那覇市松尾２丁目８−１６ 地下一階',
    city: 'Okinawa',
    genre: 'entertainment',
    members: ['Jeonghan'],
    description: 'JEONGHANが沖縄那覇で訪れたスポット。Instagramで話題に。',
    lat: 26.2160, lng: 127.6870,
    sourceUrl: 'https://www.instagram.com/p/DVm3iAbE7p0/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00277-1', imageUrl: 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/D6BDssCcVQEOYht5eTiZ/pub/sIinnINPMzXgSdR.jpeg', sourceUrl: 'https://www.instagram.com/p/DVm3iAbE7p0/', platform: 'instagram', tags: ['SEVENTEEN', 'Jeonghan'], contributor: 'SEVENTEEN', date: '2025-03-01', votes: 3, status: 'confirmed' }],
  },
  {
    id: 'SP00278',
    name: 'パークハイアット京都',
    nameLocal: 'パークハイアット京都',
    address: '京都府京都市東山区高台寺桝屋町360',
    city: 'Kyoto',
    genre: 'other',
    members: ['Hoshi'],
    description: 'HOSHIが京都滞在中に訪れたラグジュアリーホテル。Instagramで投稿。',
    lat: 34.9990, lng: 135.7810,
    sourceUrl: 'https://www.instagram.com/p/DJJ3ReAPsC6/',
    sourceName: 'Instagram',
    photos: [{ id: 'SP00278-1', imageUrl: 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/D6BDssCcVQEOYht5eTiZ/pub/1ftAOoJmJpPBjdOU5Y6R.jpeg', sourceUrl: 'https://www.instagram.com/p/DJJ3ReAPsC6/', platform: 'instagram', tags: ['SEVENTEEN', 'Hoshi'], contributor: 'SEVENTEEN', date: '2025-04-01', votes: 3, status: 'confirmed' }],
  },
]

export type Artist = {
  id: string
  name: string
  color: string
  group: string
  image: string
  isFollowing: boolean
}

export const artists: Artist[] = [
  { id: 'seventeen', name: 'SEVENTEEN', color: '#3B82F6', group: 'SEVENTEEN', image: '/artists/svt.webp', isFollowing: true },
]

const SVT = 'SEVENTEEN'
const SVT_COLOR = '#3B82F6'

export const events: Event[] = [
  // ── ライブビューイング ──
  {
    id: 'svt-dxs-lv',
    type: 'concert',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'DxS [SERENADE] ON STAGE - JAPAN Live Viewing',
    date: '2026-04-30',
    time: '17:00',
    city: 'Online, JP',
    isFollowing: true,
    tags: ['LIVE', 'TICKET'],
    image: 'https://lh3.googleusercontent.com/d/1wL1lrMMK1-ivW-qchZQ7bU0IwIMFadAf',
    sourceUrl: 'https://api-liveviewing.com/dxs_serenade/',
    sourceName: 'ライブビューイング',
  },
  // ── デジタルシングル ──
  {
    id: 'svt-tiny-light-mv',
    type: 'variety',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'Digital Single "Tiny Light" MV Release',
    date: '2026-03-30',
    time: '00:00',
    isFollowing: true,
    tags: ['YOUTUBE'],
    sourceUrl: 'https://www.seventeen-17.jp/posts/information/ovuult',
    sourceName: 'seventeen-17.jp',
  },
  // ── WORLD TOUR ENCORE CARAT ZONE ──
  {
    id: 'svt-new-encore-caratzone',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'SEVENTEEN WORLD TOUR [NEW_] ENCORE - CARAT ZONE',
    date: '2026-03-27',
    dateEnd: '2026-04-03',
    time: '13:00',
    isFollowing: true,
    tags: ['EVENT'],
    sourceUrl: 'https://weverse.io/seventeen/notice/34488?hl=ja',
    sourceName: 'Weverse',
  },
  // ── YAKUSOKU JAPAN FANMEETING ──
  {
    id: 'svt-yakusoku-tokyo-1',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "SEVENTEEN 2026 JAPAN FANMEETING 'YAKUSOKU' [東京]",
    date: '2026-05-13',
    time: '18:00',
    venue: '東京ドーム',
    city: 'Tokyo, JP',
    isFollowing: true,
    tags: ['LIVE', 'TICKET'],
    sourceUrl: 'https://www.seventeen-17.jp/posts/information/kemabu',
    sourceName: 'seventeen-17.jp',
  },
  {
    id: 'svt-yakusoku-tokyo-2',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "SEVENTEEN 2026 JAPAN FANMEETING 'YAKUSOKU' [東京]",
    date: '2026-05-14',
    time: '18:00',
    venue: '東京ドーム',
    city: 'Tokyo, JP',
    isFollowing: true,
    tags: ['LIVE', 'TICKET'],
    sourceUrl: 'https://www.seventeen-17.jp/posts/information/kemabu',
    sourceName: 'seventeen-17.jp',
  },
  {
    id: 'svt-yakusoku-osaka-1',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "SEVENTEEN 2026 JAPAN FANMEETING 'YAKUSOKU' [大阪]",
    date: '2026-05-23',
    time: '18:00',
    venue: '京セラドーム大阪',
    city: 'Osaka, JP',
    isFollowing: true,
    tags: ['LIVE', 'TICKET'],
    sourceUrl: 'https://www.seventeen-17.jp/posts/information/kemabu',
    sourceName: 'seventeen-17.jp',
  },
  {
    id: 'svt-yakusoku-osaka-2',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "SEVENTEEN 2026 JAPAN FANMEETING 'YAKUSOKU' [大阪]",
    date: '2026-05-24',
    time: '18:00',
    venue: '京セラドーム大阪',
    city: 'Osaka, JP',
    isFollowing: true,
    tags: ['LIVE', 'TICKET'],
    sourceUrl: 'https://www.seventeen-17.jp/posts/information/kemabu',
    sourceName: 'seventeen-17.jp',
  },
  // ── CARAT LAND 10TH ──
  {
    id: 'svt-caratland-incheon-1',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: '2026 SVT 10TH FAN MEETING ＜SEVENTEEN in CARAT LAND＞ [仁川 Day 1]',
    date: '2026-06-20',
    time: '17:00',
    venue: 'INCHEON ASIAD MAIN STADIUM',
    city: 'Incheon, KR',
    isFollowing: true,
    tags: ['EVENT', 'TICKET'],
    image: 'https://lh3.googleusercontent.com/d/175X5T4-rnqBp3AibscVtyIyrfeLuFfZO',
    sourceUrl: 'https://weverse.io/seventeen/notice/34504?hl=ja',
    sourceName: 'Weverse',
  },
  {
    id: 'svt-caratland-incheon-2',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: '2026 SVT 10TH FAN MEETING ＜SEVENTEEN in CARAT LAND＞ [仁川 Day 2]',
    date: '2026-06-21',
    time: '17:00',
    venue: 'INCHEON ASIAD MAIN STADIUM',
    city: 'Incheon, KR',
    isFollowing: true,
    tags: ['EVENT', 'TICKET'],
    image: 'https://lh3.googleusercontent.com/d/175X5T4-rnqBp3AibscVtyIyrfeLuFfZO',
    sourceUrl: 'https://weverse.io/seventeen/notice/34504?hl=ja',
    sourceName: 'Weverse',
  },
  // ── 雑誌 ──
  {
    id: 'svt-joshua-esquire',
    type: 'broadcast',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'Joshua — Esquire Japan 掲載',
    date: '2026-04-30',
    time: '00:00',
    isFollowing: true,
    tags: ['TV'],
    sourceUrl: 'https://www.esquire.com/jp',
    sourceName: 'Esquire Japan',
  },
  // ── HYBE ストア ──
  {
    id: 'svt-hybe-store-yokohama',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'HYBE MUSIC GROUP STORE Tree Village 横浜 OPEN',
    date: '2026-04-10',
    time: '00:00',
    city: 'Yokohama, JP',
    isFollowing: true,
    tags: ['GOODS', 'EVENT'],
    sourceUrl: 'https://www.seventeen-17.jp/posts/information/jazjcl',
    sourceName: 'seventeen-17.jp',
  },
  // ── POP-UP ──
  {
    id: 'svt-popup-mochimochi',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'SEVENTEEN もちもちトッポギ POP-UP ＠新宿マルイ',
    date: '2026-04-03',
    dateEnd: '2026-04-19',
    time: '00:00',
    venue: '新宿マルイ',
    city: 'Tokyo, JP',
    isFollowing: true,
    tags: ['POPUP', 'GOODS'],
    image: 'https://lh3.googleusercontent.com/d/1VLc3cAX4bymYU9PPxUzce10yXWa0oiO8',
    sourceUrl: 'https://www.0101.co.jp/003/event/detail.html?article_seq=142025&article_type=sto&hashtag=gourmet',
    sourceName: '新宿マルイ',
  },
  // ── DxS チケット ──
  {
    id: 'svt-dxs-lv-carat-adv',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'DxS [SERENADE] LV — CARAT会員先行抽選受付',
    date: '2026-03-30',
    dateEnd: '2026-04-02',
    time: '13:00',
    timeEnd: '23:59',
    city: 'Online, JP',
    isFollowing: true,
    tags: ['TICKET'],
    image: 'https://lh3.googleusercontent.com/d/1wL1lrMMK1-ivW-qchZQ7bU0IwIMFadAf',
    sourceUrl: 'https://www.seventeen-17.jp/posts/ticket/rtzzon',
    sourceName: 'CARAT公式',
  },
  {
    id: 'svt-dxs-lv-carat-result',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'DxS [SERENADE] LV — CARAT会員抽選結果・入金期間',
    date: '2026-04-23',
    dateEnd: '2026-04-25',
    time: '15:00',
    timeEnd: '23:00',
    city: 'Online, JP',
    isFollowing: true,
    tags: ['TICKET'],
    image: 'https://lh3.googleusercontent.com/d/1wL1lrMMK1-ivW-qchZQ7bU0IwIMFadAf',
    sourceUrl: 'https://www.seventeen-17.jp/posts/ticket/rtzzon',
    sourceName: 'CARAT公式',
  },
  {
    id: 'svt-dxs-lv-lawson-adv',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'DxS [SERENADE] LV — Loppi先行抽選受付',
    date: '2026-03-30',
    dateEnd: '2026-04-02',
    time: '13:00',
    timeEnd: '23:59',
    city: 'Online, JP',
    isFollowing: true,
    tags: ['TICKET'],
    image: 'https://lh3.googleusercontent.com/d/1wL1lrMMK1-ivW-qchZQ7bU0IwIMFadAf',
    sourceUrl: 'https://l-tike.com/cinema/mevent/?mid=780369',
    sourceName: 'Loppi',
  },
  // ── YAKUSOKU チケット ──
  {
    id: 'svt-yakusoku-carat-adv',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "YAKUSOKU — CARAT会員先行抽選受付",
    date: '2026-04-02',
    dateEnd: '2026-04-05',
    time: '13:00',
    timeEnd: '23:59',
    city: 'Online, JP',
    isFollowing: true,
    tags: ['TICKET'],
    sourceUrl: 'https://www.seventeen-17.jp/posts/information/jsbkyi',
    sourceName: 'seventeen-17.jp',
  },
  {
    id: 'svt-yakusoku-carat-result',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "YAKUSOKU — CARAT会員抽選結果・入金期間",
    date: '2026-04-10',
    dateEnd: '2026-04-12',
    time: '11:00',
    timeEnd: '23:00',
    city: 'Online, JP',
    isFollowing: true,
    tags: ['TICKET'],
    sourceUrl: 'https://www.seventeen-17.jp/posts/information/jsbkyi',
    sourceName: 'seventeen-17.jp',
  },
  {
    id: 'svt-yakusoku-mobile-adv',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "YAKUSOKU — モバイル会員先行抽選受付",
    date: '2026-04-07',
    dateEnd: '2026-04-10',
    time: '13:00',
    timeEnd: '23:59',
    city: 'Online, JP',
    isFollowing: true,
    tags: ['TICKET'],
    sourceUrl: 'https://www.seventeen-17.jp/posts/information/jsbkyi',
    sourceName: 'seventeen-17.jp',
  },
  {
    id: 'svt-yakusoku-mobile-result',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "YAKUSOKU — モバイル会員抽選結果・入金期間",
    date: '2026-04-17',
    dateEnd: '2026-04-19',
    time: '11:00',
    timeEnd: '23:00',
    city: 'Online, JP',
    isFollowing: true,
    tags: ['TICKET'],
    sourceUrl: 'https://www.seventeen-17.jp/posts/information/jsbkyi',
    sourceName: 'seventeen-17.jp',
  },
  // ── CARAT LAND チケット ──
  {
    id: 'svt-caratland-preauth',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'CARAT LAND — 会員資格事前認証',
    date: '2026-05-13',
    dateEnd: '2026-05-15',
    time: '14:00',
    timeEnd: '11:59',
    city: 'Online, KR',
    isFollowing: true,
    tags: ['TICKET'],
    image: 'https://lh3.googleusercontent.com/d/175X5T4-rnqBp3AibscVtyIyrfeLuFfZO',
    sourceUrl: 'https://weverse.io/seventeen/notice/34504?hl=ja',
    sourceName: 'Weverse',
  },
  {
    id: 'svt-caratland-adv',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'CARAT LAND — CARAT会員先行予約',
    date: '2026-05-15',
    time: '20:00',
    timeEnd: '23:59',
    city: 'Online, KR',
    isFollowing: true,
    tags: ['TICKET'],
    image: 'https://lh3.googleusercontent.com/d/175X5T4-rnqBp3AibscVtyIyrfeLuFfZO',
    sourceUrl: 'https://weverse.io/seventeen/notice/34504?hl=ja',
    sourceName: 'Weverse',
  },
  {
    id: 'svt-caratland-general',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'CARAT LAND — 一般発売',
    date: '2026-05-18',
    time: '20:00',
    city: 'Online, KR',
    isFollowing: true,
    tags: ['TICKET'],
    image: 'https://lh3.googleusercontent.com/d/175X5T4-rnqBp3AibscVtyIyrfeLuFfZO',
    sourceUrl: 'https://weverse.io/seventeen/notice/34504?hl=ja',
    sourceName: 'Weverse',
  },
  // ── 誕生日 ──
  {
    id: 'svt-birthday-mingyu',
    type: 'birthday',
    artist: SVT,
    artistColor: '#14B8A6',
    title: 'MINGYU Birthday',
    date: '2026-04-06',
    time: '00:00',
    isFollowing: true,
    tags: ['EVENT'],
  },
]

export const eventTypeConfig: Record<EventType, { label: string; color: string; bg: string }> = {
  concert: { label: 'CONCERT', color: '#F3B4E3', bg: 'rgba(243,180,227,0.15)' },
  fanmeet: { label: 'FAN MEET', color: '#FCD34D', bg: 'rgba(252,211,77,0.15)' },
  release: { label: 'RELEASE', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  broadcast: { label: 'BROADCAST', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  birthday: { label: 'BIRTHDAY', color: '#FB923C', bg: 'rgba(251,146,60,0.15)' },
  variety: { label: 'VARIETY', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
}
