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
}

/** スポットが「情報完備」かどうか（ピンの色判定用） */
export function isSpotComplete(spot: PilgrimageSpot, confirmedUserPhotoCount: number): boolean {
  // シード写真はすべて confirmed 扱い
  const seedCount = spot.photos?.length ?? 0
  return !!spot.officialUrl && !!spot.sourceUrl && (seedCount + confirmedUserPhotoCount) > 0
}

/** 韓国 → NAVER MAP / 日本 → Google Maps */
export function getMapUrl(spot: PilgrimageSpot): string {
  const isKorea = spot.city === 'Seoul' || spot.city === 'Busan'
  if (isKorea) {
    return `https://map.naver.com/v5/?c=${spot.lng},${spot.lat},15,0,0,0,dh`
  }
  return `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`
}

export function getMapAppName(spot: PilgrimageSpot): string {
  const isKorea = spot.city === 'Seoul' || spot.city === 'Busan'
  return isKorea ? 'NAVER MAP' : 'Google Maps'
}

export const pilgrimageSpots: PilgrimageSpot[] = [
  {
    id: 'spot-1',
    name: 'HYBE 本社ビル',
    nameLocal: 'HYBE 본사빌딩',
    address: '서울 용산구 한강대로 42',
    city: 'Seoul',
    genre: 'music',
    members: ['ALL'],
    description: 'SEVENTEENが所属するPledis Entertainmentの親会社HYBEの本社。ファンサインイベントも開催される。',
    lat: 37.5296, lng: 126.9647,
    officialUrl: 'https://hybecorp.com',
    sourceUrl: 'https://hybecorp.com',
    sourceName: 'HYBE公式',
  },
  {
    id: 'spot-2',
    name: 'KSPO DOME',
    nameLocal: 'KSPO 돔',
    address: '서울 송파구 올림픽로 424',
    city: 'Seoul',
    genre: 'entertainment',
    members: ['ALL'],
    description: 'CARAThon・ODE TO YOU等、SEVENTEENの国内コンサートの定番会場。',
    lat: 37.5204, lng: 127.1238,
    officialUrl: 'https://kspo.or.kr',
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse',
  },
  {
    id: 'spot-3',
    name: 'カフェ BORA 弘大店',
    nameLocal: '카페 보라 홍대점',
    address: '서울 마포구 어울마당로 35',
    city: 'Seoul',
    genre: 'cafe',
    members: ['Jeonghan', 'Joshua'],
    description: 'Jeonghanが Going SVT でよく訪れるおしゃれなインスタ映えカフェ。',
    lat: 37.5564, lng: 126.9239,
    sourceUrl: 'https://youtube.com/@seventeen_official',
    sourceName: 'Going SEVENTEEN',
  },
  {
    id: 'spot-4',
    name: 'サムギョプサル 弘大',
    nameLocal: '돼지집 홍대',
    address: '서울 마포구 와우산로 29',
    city: 'Seoul',
    genre: 'restaurant',
    members: ['Hoshi', 'Dino', 'S.Coups'],
    description: 'Hoshi が「めちゃ美味い」と語ったことで話題のサムギョプサル店。',
    lat: 37.5536, lng: 126.9245,
    sourceUrl: 'https://youtube.com/@seventeen_official',
    sourceName: 'Going SEVENTEEN EP.89',
  },
  {
    id: 'spot-5',
    name: 'Woozi Studio 付近 (弘大)',
    nameLocal: '우지 스튜디오 인근 (홍대)',
    address: '서울 마포구 홍익로 6길',
    city: 'Seoul',
    genre: 'music',
    members: ['Woozi'],
    description: 'Woozi の個人スタジオ近隣エリア。V LIVEで場所をヒントとして紹介。',
    lat: 37.5570, lng: 126.9250,
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse Live',
  },
  {
    id: 'spot-6',
    name: 'LINE FRIENDS STORE 弘大',
    nameLocal: '라인프렌즈 스토어 홍대',
    address: '서울 마포구 양화로 188',
    city: 'Seoul',
    genre: 'fashion',
    members: ['Vernon', 'Mingyu'],
    description: 'VernonとMinguが散歩がてら立ち寄るキャラクターグッズショップ。',
    lat: 37.5551, lng: 126.9233,
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse',
  },
  {
    id: 'spot-7',
    name: '東京ドーム',
    nameLocal: '東京ドーム',
    address: '東京都文京区後楽1-3-61',
    city: 'Tokyo',
    genre: 'entertainment',
    members: ['ALL'],
    description: 'WORLD TOUR 2026 の東京公演会場。5万人収容。周辺にファン集合スポット多数。',
    lat: 35.7056, lng: 139.7519,
    officialUrl: 'https://www.tokyo-dome.co.jp',
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse',
  },
  {
    id: 'spot-8',
    name: 'ZARA 原宿店',
    nameLocal: 'ZARA 原宿店',
    address: '東京都渋谷区神宮前1-7-1',
    city: 'Tokyo',
    genre: 'fashion',
    members: ['Mingyu', 'Vernon', 'The8'],
    description: 'Mingyu が日本滞在時に訪れたと語ったファッションスポット。',
    lat: 35.6710, lng: 139.7026,
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse Live',
  },
  {
    id: 'spot-9',
    name: '一蘭 渋谷店',
    nameLocal: '一蘭 渋谷店',
    address: '東京都渋谷区道玄坂2-14-8',
    city: 'Tokyo',
    genre: 'restaurant',
    members: ['DK', 'Seungkwan', 'Mingyu'],
    description: 'Going SVTで訪問歴あり。「一人焼豚ラーメン」と呼んで盛り上がった回。',
    lat: 35.6589, lng: 139.6988,
    officialUrl: 'https://ichiran.com',
    sourceUrl: 'https://youtube.com/@seventeen_official',
    sourceName: 'Going SEVENTEEN EP.102',
  },
  {
    id: 'spot-10',
    name: 'Blue Bottle Coffee 青山店',
    nameLocal: 'Blue Bottle Coffee 青山店',
    address: '東京都港区南青山3-13-14',
    city: 'Tokyo',
    genre: 'cafe',
    members: ['Joshua', 'Wonwoo'],
    description: 'JoshuaとWonwooが日本滞在中に訪れたとWeverse postに投稿。',
    lat: 35.6660, lng: 139.7155,
    officialUrl: 'https://bluebottlecoffee.com/jp',
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse Post',
  },
  {
    id: 'spot-11',
    name: 'ドン・キホーテ 道頓堀店',
    nameLocal: 'ドン・キホーテ 道頓堀店',
    address: '大阪府大阪市中央区道頓堀1-7-1',
    city: 'Osaka',
    genre: 'other',
    members: ['Hoshi', 'DK', 'Seungkwan'],
    description: 'ライブ後に数人がショッピングしたとSNSで話題に。',
    lat: 34.6686, lng: 135.5024,
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'ファン目撃情報',
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
  {
    id: 'svt-carat-lottery-1',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'SEVENTEEN Japan FC "CARAT" 会員先行抽選受付',
    date: '2026-04-02',
    dateEnd: '2026-04-05',
    time: '13:00',
    city: 'Online, JP',
    isFollowing: true,
    tags: ['TICKET', 'EVENT'],
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'CARAT公式',
  },
  {
    id: 'svt-carat-lottery-2',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'SEVENTEEN 抽選結果確認・入金期間',
    date: '2026-04-10',
    dateEnd: '2026-04-12',
    time: '11:00',
    city: 'Online, JP',
    isFollowing: true,
    tags: ['TICKET'],
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'CARAT公式',
  },
  {
    id: 'svt-e1',
    type: 'broadcast',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'Inkigayo Special Stage',
    date: '2026-04-02',
    time: '12:10',
    venue: 'SBS Prism Tower',
    city: 'Seoul, KR',
    isFollowing: true,
    tags: ['TV'],
    sourceUrl: 'https://programs.sbs.co.kr/enter/inkigayo/',
    sourceName: 'SBS Inkigayo',
  },
  {
    id: 'svt-e2',
    type: 'birthday',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'Mingyu Birthday 🎂',
    date: '2026-04-06',
    time: '00:00',
    isFollowing: true,
    tags: ['EVENT'],
    image: '/mingyu.jpg',
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse',
  },
  {
    id: 'svt-e3',
    type: 'variety',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'GOING SEVENTEEN 2026 EP.12 Upload',
    date: '2026-04-08',
    time: '20:00',
    isFollowing: true,
    tags: ['YOUTUBE'],
    sourceUrl: 'https://youtube.com/@seventeen_official',
    sourceName: 'YouTube',
  },
  {
    id: 'svt-e4',
    type: 'concert',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "SEVENTEEN TOUR 'ODE TO YOU' — Seoul",
    date: '2026-04-10',
    time: '18:00',
    venue: 'KSPO DOME',
    city: 'Seoul, KR',
    isFollowing: true,
    tags: ['LIVE', 'TICKET'],
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse Shop',
  },
  {
    id: 'svt-e5',
    type: 'release',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "SEVENTEEN — 'SPILL THE FEELS' Release",
    date: '2026-04-15',
    time: '00:00',
    isFollowing: true,
    tags: ['CD', 'LUCKYDRAW'],
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse Shop',
  },
  {
    id: 'svt-e6',
    type: 'broadcast',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'Music Bank Performance',
    date: '2026-04-17',
    time: '17:10',
    venue: 'KBS Hall',
    city: 'Seoul, KR',
    isFollowing: true,
    tags: ['TV'],
    sourceUrl: 'https://kbs.co.kr/2tv/ent/musicbank/',
    sourceName: 'KBS Music Bank',
  },
  {
    id: 'svt-e7',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "SEVENTEEN FAN MEETING 'CARATLAND 2026'",
    date: '2026-04-20',
    time: '15:00',
    venue: 'COEX Hall',
    city: 'Seoul, KR',
    isFollowing: true,
    tags: ['EVENT', 'TICKET'],
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse',
  },
  {
    id: 'svt-e8',
    type: 'concert',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'SEVENTEEN WORLD TOUR 2026 — Tokyo Day 1',
    date: '2026-05-01',
    time: '18:30',
    venue: 'Tokyo Dome',
    city: 'Tokyo, JP',
    isFollowing: true,
    tags: ['LIVE', 'TICKET'],
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse Shop',
  },
  {
    id: 'svt-e9',
    type: 'concert',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'SEVENTEEN WORLD TOUR 2026 — Tokyo Day 2',
    date: '2026-05-02',
    time: '18:30',
    venue: 'Tokyo Dome',
    city: 'Tokyo, JP',
    isFollowing: true,
    tags: ['LIVE', 'TICKET'],
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse Shop',
  },
  {
    id: 'svt-e10',
    type: 'variety',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: 'GOING SEVENTEEN 2026 EP.13 Upload',
    date: '2026-05-06',
    time: '20:00',
    isFollowing: true,
    tags: ['YOUTUBE'],
    sourceUrl: 'https://youtube.com/@seventeen_official',
    sourceName: 'YouTube',
  },
  // ── 期間イベント（ポップアップ / カフェコラボ） ──
  {
    id: 'svt-popup-1',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "SEVENTEEN × TOWER RECORDS ポップアップストア",
    date: '2026-04-18',
    dateEnd: '2026-04-26',
    time: '11:00',
    venue: 'TOWER RECORDS 渋谷店 B1F',
    city: 'Tokyo, JP',
    isFollowing: true,
    tags: ['GOODS', 'EVENT'],
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse',
  },
  {
    id: 'svt-cafe-1',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "SEVENTEEN カフェコラボ「CARAT CAFE」",
    date: '2026-04-10',
    dateEnd: '2026-04-30',
    time: '10:00',
    venue: 'THE GUEST café & diner 原宿店',
    city: 'Tokyo, JP',
    isFollowing: true,
    tags: ['EVENT'],
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse',
  },
  {
    id: 'svt-popup-2',
    type: 'fanmeet',
    artist: SVT,
    artistColor: SVT_COLOR,
    title: "SPILL THE FEELS リリース記念 ポップアップ",
    date: '2026-04-15',
    dateEnd: '2026-04-20',
    time: '11:00',
    venue: 'HMV&BOOKS SHIBUYA',
    city: 'Tokyo, JP',
    isFollowing: true,
    tags: ['GOODS', 'CD'],
    sourceUrl: 'https://weverse.io/seventeen',
    sourceName: 'Weverse Shop',
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
