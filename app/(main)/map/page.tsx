'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  pilgrimageSpots,
  spotGenreConfig,
  seventeenMembers,
  SpotGenre,
  PilgrimageSpot,
  SpotPhoto,
  SpotPlatform,
  getMapUrl,
  getMapAppName,
  isSpotComplete,
  events,
} from '@/lib/mockData'
import EventCard from '@/components/EventCard'
import { useFavoriteSpots } from '@/lib/useFavoriteSpots'
import { useSpotPhotos } from '@/lib/useSpotPhotos'
import { compressImage } from '@/lib/useMyEntries'

const SpotMap = dynamic(() => import('@/components/SpotMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#EEF0F5' }}>
      <div className="flex flex-col items-center gap-2" style={{ color: '#8E8E93' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-40">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
        <span className="text-xs">地図を読み込み中...</span>
      </div>
    </div>
  ),
})


const ALL_GENRES: SpotGenre[] = ['cafe', 'restaurant', 'fashion', 'entertainment', 'music', 'other']

const PLATFORM_CONFIG: Record<SpotPlatform, { label: string; color: string; icon: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C', icon: '📸' },
  weverse:   { label: 'Weverse',   color: '#02D1AC', icon: '🎵' },
  x:         { label: 'X',         color: '#1C1C1E', icon: '𝕏' },
  other:     { label: 'その他',    color: '#636366', icon: '🔗' },
}

const ALL_TAGS = ['SEVENTEEN', ...seventeenMembers.map((m) => m.name)]

export default function MapPage() {
  const [search, setSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState('ALL')
  const [genreFilter, setGenreFilter] = useState<SpotGenre | 'ALL' | 'LIMITED'>('ALL')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailSpot, setDetailSpot] = useState<PilgrimageSpot | null>(null)
  const [uploadSpot, setUploadSpot] = useState<PilgrimageSpot | null>(null)
  const [favOnly, setFavOnly] = useState(false)
  const { toggle, isFavorite, count: favCount } = useFavoriteSpots()
  const { photoMap, addPhoto, removePhoto, votePhoto, getPhotos, getConfirmedCount } = useSpotPhotos()
  const spotRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const filtered = genreFilter === 'LIMITED' ? [] : pilgrimageSpots.filter((spot) => {
    if (favOnly && !isFavorite(spot.id)) return false
    if (search && !spot.name.toLowerCase().includes(search.toLowerCase()) &&
        !spot.description.toLowerCase().includes(search.toLowerCase())) return false
    if (genreFilter !== 'ALL' && spot.genre !== genreFilter) return false
    if (memberFilter !== 'ALL') {
      if (!spot.members.includes('ALL') && !spot.members.includes(memberFilter)) return false
    }
    return true
  })

  const activeScheduleEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return events.filter((e) =>
      e.tags?.some((t) => t === 'POPUP' || t === 'EVENT') &&
      (e.dateEnd ? e.date <= today && today <= e.dateEnd : e.date === today)
    )
  }, [])

  const incompleteIds = useMemo(() => {
    const set = new Set<string>()
    pilgrimageSpots.forEach((spot) => {
      if (!isSpotComplete(spot, getConfirmedCount(spot.id))) {
        set.add(spot.id)
      }
    })
    return set
  }, [photoMap])

  const handleSpotSelect = useCallback((id: string) => {
    setSelectedId(id)
    const spot = pilgrimageSpots.find((s) => s.id === id)
    if (spot) {
      setDetailSpot(spot)
    } else {
      setTimeout(() => {
        spotRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }, [])

  const setSpotRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    spotRefs.current[id] = el
  }, [])

  // 詳細画面表示中
  if (detailSpot) {
    return (
      <SpotDetailScreen
        spot={detailSpot}
        isFavorite={isFavorite(detailSpot.id)}
        onToggleFav={() => toggle(detailSpot.id)}
        userPhotos={getPhotos(detailSpot.id)}
        onRemovePhoto={(photoId) => removePhoto(detailSpot.id, photoId)}
        onConfirmPhoto={(photoId) => votePhoto(detailSpot.id, photoId)}
        onOpenUpload={() => { setUploadSpot(detailSpot); setDetailSpot(null) }}
        isIncomplete={incompleteIds.has(detailSpot.id)}
        onClose={() => setDetailSpot(null)}
      />
    )
  }

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>

      {/* Header */}
      <header
        className="flex-shrink-0 px-4 pb-3"
        style={{
          background: '#F8F9FA',
          borderBottom: '1px solid #E5E5EA',
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-black tracking-wider" style={{ color: '#1C1C1E' }}>MAP</h1>
          <span className="text-xs font-bold px-2.5 py-1.5 rounded-full"
            style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}>
            {genreFilter === 'LIMITED' ? `${activeScheduleEvents.length} 件` : `${filtered.length} 件`}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="店名・説明で検索"
            className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FFFFFF', color: '#1C1C1E', border: '1px solid #2E2E32' }}
          />
        </div>
      </header>


      {/* Map */}
      <div className="flex-shrink-0" style={{ height: 240 }}>
        <SpotMap
          spots={filtered}
          selectedId={selectedId}
          onSpotClick={handleSpotSelect}
          incompleteIds={incompleteIds}
        />
      </div>

      {/* Scrollable filter + list */}
      <div className="flex-1 overflow-y-auto">

        {/* Genre filter */}
        <div className="px-4 pt-1 pb-1">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setGenreFilter('ALL')}
              className="flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold min-h-[44px]"
              style={genreFilter === 'ALL'
                ? { background: '#F3B4E3', color: '#F8F9FA' }
                : { background: '#FFFFFF', color: '#636366' }
              }>
              ジャンル: 全て
            </button>
            {activeScheduleEvents.length > 0 && (
              <button onClick={() => setGenreFilter('LIMITED')}
                className="flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold min-h-[44px] flex items-center gap-1"
                style={genreFilter === 'LIMITED'
                  ? { background: '#FB923C', color: '#F8F9FA' }
                  : { background: 'rgba(251,146,60,0.12)', color: '#FB923C' }
                }>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'currentColor' }} />
                期間限定 {activeScheduleEvents.length}件
              </button>
            )}
            {ALL_GENRES.map((g) => {
              const cfg = spotGenreConfig[g]
              return (
                <button key={g} onClick={() => setGenreFilter(g)}
                  className="flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold min-h-[44px]"
                  style={genreFilter === g
                    ? { background: cfg.color, color: '#F8F9FA' }
                    : { background: cfg.bg, color: cfg.color }
                  }>
                  {cfg.icon} {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Member filter */}
        <div className="px-4 pt-1 pb-3">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setMemberFilter('ALL')}
              className="flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold min-h-[44px]"
              style={memberFilter === 'ALL'
                ? { background: '#3B82F6', color: '#1C1C1E' }
                : { background: '#FFFFFF', color: '#636366' }
              }>
              推し: 全員
            </button>
            {seventeenMembers.map((m) => (
              <button key={m.id} onClick={() => setMemberFilter(m.name)}
                className="flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-semibold min-h-[44px]"
                style={memberFilter === m.name
                  ? { background: m.color, color: '#1C1C1E' }
                  : { background: '#FFFFFF', color: '#636366' }
                }>
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Spot list / Limited events */}
        <div className="px-4 pb-8 flex flex-col gap-3">
          {genreFilter === 'LIMITED' ? (
            activeScheduleEvents.map((event) => (
              <div key={event.id} className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E5EA' }}>
                <EventCard event={event} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-14" style={{ color: '#8E8E93' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mb-2 opacity-30">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <p className="text-sm">スポットが見つかりません</p>
            </div>
          ) : (
            filtered.map((spot) => {
              const gcfg = spotGenreConfig[spot.genre]
              const isSelected = selectedId === spot.id
              const fav = isFavorite(spot.id)
              const incomplete = incompleteIds.has(spot.id)
              const userPhotos = getPhotos(spot.id)
              const totalPhotos = (spot.photos?.length ?? 0) + userPhotos.length
              return (
                <div key={spot.id} ref={setSpotRef(spot.id)} className="rounded-xl overflow-hidden relative"
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${isSelected ? gcfg.color + '80' : 'transparent'}`,
                  }}>
                  {/* タップで詳細を開くメインエリア */}
                  <div onClick={() => { handleSpotSelect(spot.id); setDetailSpot(spot) }}
                    className="flex items-start gap-3 p-4 pr-14 cursor-pointer">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: gcfg.bg }}>
                      {gcfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: gcfg.bg, color: gcfg.color }}>{gcfg.label}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: '#F0F0F5', color: '#636366' }}>{spot.city}</span>
                        {totalPhotos > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                            style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}>
                            📷 {totalPhotos}
                          </span>
                        )}
                        {incomplete && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>！情報募集中</span>
                        )}
                      </div>
                      <p className="text-sm font-bold leading-tight" style={{ color: '#1C1C1E' }}>{spot.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#8E8E93' }}>{spot.address}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[10px] font-semibold" style={{ color: '#3B82F680' }}>#SEVENTEEN</span>
                        {(spot.members.includes('ALL') ? seventeenMembers.map((m) => m.name) : spot.members).map((m) => (
                          <span key={m} className="text-[10px] font-semibold" style={{ color: '#3B82F6' }}>#{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* ハートボタン：絶対配置で右上に */}
                  <button
                    onClick={() => toggle(spot.id)}
                    className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full"
                    style={{ background: fav ? 'rgba(251,113,133,0.15)' : 'transparent' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? '#FB7185' : 'none'} stroke={fav ? '#FB7185' : '#6B6B70'} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 写真投稿モーダル */}
      {uploadSpot && (
        <PhotoUploadModal
          spot={uploadSpot}
          onSave={(photo) => { addPhoto(uploadSpot.id, { ...photo, status: 'pending', votes: 0 }); setUploadSpot(null); setDetailSpot(uploadSpot) }}
          onClose={() => { setUploadSpot(null); setDetailSpot(uploadSpot) }}
        />
      )}
    </div>
  )
}

// ─── プラットフォームアイコン ─────────────────────────────
function PlatformBadge({ platform }: { platform?: SpotPlatform }) {
  const cfg = PLATFORM_CONFIG[platform ?? 'other']
  return (
    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
      style={{ background: cfg.color + '22', color: cfg.color }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ─── スポット詳細画面（フルスクリーン） ──────────────────────
function SpotDetailScreen({
  spot, isFavorite, onToggleFav, userPhotos, onRemovePhoto, onConfirmPhoto, onOpenUpload, isIncomplete, onClose,
}: {
  spot: PilgrimageSpot
  isFavorite: boolean
  onToggleFav: () => void
  userPhotos: SpotPhoto[]
  onRemovePhoto: (id: string) => void
  onConfirmPhoto: (id: string) => void
  onOpenUpload: () => void
  isIncomplete: boolean
  onClose: () => void
}) {
  const gcfg = spotGenreConfig[spot.genre]
  const mapUrl = getMapUrl(spot)
  const mapName = getMapAppName(spot)
  const isKorea = spot.city === 'Seoul' || spot.city === 'Busan'
  const seedPhotos: SpotPhoto[] = (spot.photos ?? []).map((p) => ({ ...p, status: 'confirmed' as const }))
  const allPhotos: SpotPhoto[] = [...seedPhotos, ...userPhotos]
  const pendingPhotos = userPhotos.filter((p) => p.status === 'pending')
  const confirmedPhotos = allPhotos.filter((p) => p.status === 'confirmed')

  return (
    <div className="flex flex-col h-full" style={{ background: '#F8F9FA' }}>

      {/* ヘッダー */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-4"
        style={{
          background: '#F8F9FA',
          borderBottom: '1px solid #E5E5EA',
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          paddingBottom: '12px',
        }}
      >
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
          style={{ background: '#FFFFFF', border: '1px solid #E5E5EA' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold tracking-wider" style={{ color: '#8E8E93' }}>MAP</p>
          <p className="text-base font-black truncate" style={{ color: '#1C1C1E' }}>{spot.name}</p>
        </div>
        <button onClick={onToggleFav}
          className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
          style={{ background: isFavorite ? 'rgba(251,113,133,0.15)' : '#FFFFFF', border: '1px solid #E5E5EA' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? '#FB7185' : 'none'} stroke={isFavorite ? '#FB7185' : '#8E8E93'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">

        {/* ── 写真ギャラリー（最上部・メイン） ── */}
        <div className="mb-4">
          {confirmedPhotos.length === 0 ? (
            <button onClick={onOpenUpload}
              className="w-full flex flex-col items-center justify-center gap-2"
              style={{ height: 200, background: '#EEEFF4' }}>
              <span className="text-4xl">📷</span>
              <span className="text-sm font-semibold" style={{ color: '#636366' }}>最初の写真を投稿しよう</span>
            </button>
          ) : (
            <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {confirmedPhotos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo}
                  isUserPhoto={userPhotos.some((p) => p.id === photo.id)}
                  onRemove={() => onRemovePhoto(photo.id)} />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 flex flex-col gap-4 pb-28">

          {/* 基本情報 */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }}>
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: gcfg.bg, color: gcfg.color }}>{gcfg.icon} {gcfg.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: '#F0F0F5', color: '#636366' }}>{spot.city}</span>
                {isIncomplete && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>！情報募集中</span>
                )}
              </div>
              {spot.nameLocal && (
                <p className="text-sm font-semibold mb-2" style={{ color: '#636366' }}>{spot.nameLocal}</p>
              )}
              <p className="text-sm" style={{ color: '#8E8E93' }}>📍 {spot.address}</p>
            </div>

          </div>

          {/* マップ・公式HP */}
          <div className="flex gap-3">
            <a href={mapUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
              style={{ background: isKorea ? '#03C75A' : '#4285F4', color: '#FFFFFF' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {mapName}で開く
            </a>
            {spot.officialUrl && (
              <a href={spot.officialUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: '#FFFFFF', color: '#1C1C1E', border: '1px solid #E5E5EA' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                </svg>
                公式HP
              </a>
            )}
          </div>

          {/* メンバータグ */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#8E8E93' }}>関連メンバー</p>
            <div className="flex flex-wrap gap-2">
              {spot.members.includes('ALL') ? (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: '#3B82F620', color: '#3B82F6' }}>全メンバー</span>
              ) : (
                spot.members.map((name) => {
                  const m = seventeenMembers.find((x) => x.name === name)
                  return (
                    <span key={name} className="text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: (m?.color ?? '#9A9A9F') + '25', color: m?.color ?? '#9A9A9F' }}>
                      {name}
                    </span>
                  )
                })
              )}
            </div>
          </div>

          {/* 説明 */}
          {spot.description && (
            <p className="text-sm leading-relaxed" style={{ color: '#636366' }}>{spot.description}</p>
          )}

          {/* 承認待ち写真 */}
          {pendingPhotos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>仮</span>
                <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>承認待ち {pendingPhotos.length}件</p>
              </div>
              <div className="flex flex-col gap-2">
                {pendingPhotos.map((photo) => (
                  <div key={photo.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: '#FFFFFF', border: '1px solid rgba(245,158,11,0.3)' }}>
                    {photo.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
                        style={{ background: '#F0F0F5' }}>📷</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#1C1C1E' }}>
                        {photo.caption || photo.contributor}
                      </p>
                      <p className="text-[11px]" style={{ color: '#8E8E93' }}>{photo.date}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => onConfirmPhoto(photo.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>
                        ✓ {photo.votes ?? 0}/3
                      </button>
                      <button onClick={() => onRemovePhoto(photo.id)}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(248,113,113,0.1)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ソース */}
          {spot.sourceUrl && (
            <a href={spot.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5" style={{ color: '#8E8E93' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
              <span className="text-[11px]">ソース: {spot.sourceName}</span>
            </a>
          )}
        </div>
      </div>

      {/* 写真投稿ボタン（固定フッター） */}
      <div
        className="flex-shrink-0 px-4 pt-3 pb-4"
        style={{
          background: '#F8F9FA',
          borderTop: '1px solid #E5E5EA',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <button onClick={onOpenUpload}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #F3B4E3, #C97AB8)', color: '#FFFFFF' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          写真を投稿する
        </button>
      </div>
    </div>
  )
}

// ─── 写真カード ─────────────────────────────────────────────
function PhotoCard({
  photo, isUserPhoto, onRemove,
}: {
  photo: SpotPhoto
  isUserPhoto: boolean
  onRemove: () => void
}) {
  const memberColors: Record<string, string> = Object.fromEntries(
    seventeenMembers.map((m) => [m.name, m.color])
  )

  const cardContent = (
    <div className="flex-shrink-0 rounded-xl overflow-hidden flex flex-col"
      style={{ width: 120, minWidth: 120, background: '#F0F0F5', cursor: photo.sourceUrl ? 'pointer' : 'default' }}>
      {/* 画像 */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
        {photo.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1C1C1F 0%, #252528 100%)' }}>
            <span className="text-3xl opacity-30">📷</span>
          </div>
        )}
        {/* プラットフォームバッジ */}
        {photo.platform && photo.platform !== 'other' && (
          <div className="absolute top-2 left-2">
            <span className="text-sm">{PLATFORM_CONFIG[photo.platform].icon}</span>
          </div>
        )}
        {/* ユーザー投稿は削除ボタン */}
        {isUserPhoto && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove() }}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.75)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {/* テキスト情報 */}
      <div className="px-2 pt-1.5 pb-2 flex flex-col gap-1">
        {/* タグ */}
        {photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {photo.tags.slice(0, 3).map((tag) => {
              const color = tag === 'SEVENTEEN' ? '#3B82F6' : (memberColors[tag] ?? '#9A9A9F')
              return (
                <span key={tag} className="text-[9px] font-bold leading-tight"
                  style={{ color }}>
                  #{tag}
                </span>
              )
            })}
          </div>
        )}
        {/* 投稿者 + 日付 */}
        <p className="text-[9px] leading-tight truncate" style={{ color: '#8E8E93' }}>
          {photo.contributor}
        </p>
        <p className="text-[9px] leading-tight" style={{ color: '#C7C7CC' }}>
          {photo.date.slice(0, 7).replace('-', '/')}
        </p>
      </div>
    </div>
  )

  if (photo.sourceUrl) {
    return (
      <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
        {cardContent}
      </a>
    )
  }
  return cardContent
}

// ─── 写真投稿モーダル ───────────────────────────────────────
function PhotoUploadModal({
  spot, onSave, onClose,
}: {
  spot: PilgrimageSpot
  onSave: (photo: SpotPhoto) => void
  onClose: () => void
}) {
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined)
  const [sourceUrl, setSourceUrl] = useState('')
  const [platform, setPlatform] = useState<SpotPlatform>('instagram')
  const [selectedTags, setSelectedTags] = useState<string[]>(['SEVENTEEN'])
  const [contributor, setContributor] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [caption, setCaption] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleImagePick = async (files: FileList | null) => {
    if (!files || !files[0]) return
    const url = await compressImage(files[0], 1200, 0.85)
    setImageDataUrl(url)
  }

  const handleSave = () => {
    if (!contributor.trim()) return
    const photo: SpotPhoto = {
      id: Date.now().toString(),
      imageUrl: imageDataUrl,
      sourceUrl: sourceUrl.trim() || undefined,
      platform,
      tags: selectedTags,
      contributor: contributor.trim(),
      date,
      caption: caption.trim() || undefined,
      status: 'pending',
      votes: 0,
    }
    onSave(photo)
  }

  const gcfg = spotGenreConfig[spot.genre]
  const memberColors: Record<string, string> = Object.fromEntries(
    seventeenMembers.map((m) => [m.name, m.color])
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose} />
      <div className="relative flex flex-col rounded-t-2xl overflow-hidden" style={{ background: '#FFFFFF', maxHeight: '92vh' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #2E2E32' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>📷 来店フォトを投稿</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: gcfg.bg, color: gcfg.color }}>
                {gcfg.icon} {spot.name}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

          {/* 画像 */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>写真（任意）</label>
            {imageDataUrl ? (
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDataUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setImageDataUrl(undefined)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-36 rounded-xl flex flex-col items-center justify-center gap-2"
                style={{ border: '2px dashed #E5E5EA', color: '#8E8E93' }}>
                <span className="text-3xl">📷</span>
                <span className="text-xs">タップして写真を追加</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleImagePick(e.target.files)} />
          </div>

          {/* ソースURL */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              ソースURL（Instagram / Weverse / X の投稿リンク）
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }}
            />
            {/* プラットフォーム選択 */}
            {sourceUrl && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {(Object.keys(PLATFORM_CONFIG) as SpotPlatform[]).map((p) => {
                  const cfg = PLATFORM_CONFIG[p]
                  return (
                    <button key={p} onClick={() => setPlatform(p)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={platform === p
                        ? { background: cfg.color + '30', color: cfg.color, border: `1px solid ${cfg.color}60` }
                        : { background: '#F0F0F5', color: '#8E8E93', border: '1px solid #E5E5EA' }
                      }>
                      {cfg.icon} {cfg.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* タグ */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              タグ（関連するメンバーを選択）
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => {
                const selected = selectedTags.includes(tag)
                const color = tag === 'SEVENTEEN' ? '#3B82F6' : (memberColors[tag] ?? '#9A9A9F')
                return (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={selected
                      ? { background: color + '25', color, border: `1px solid ${color}50` }
                      : { background: '#F0F0F5', color: '#8E8E93', border: '1px solid #E5E5EA' }
                    }>
                    #{tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 投稿者名 */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              投稿者名 <span style={{ color: '#F3B4E3' }}>*</span>
            </label>
            <input
              type="text"
              value={contributor}
              onChange={(e) => setContributor(e.target.value)}
              placeholder="@yourname"
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }}
            />
          </div>

          {/* 来店日 */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>来店日</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }}
            />
          </div>

          {/* キャプション */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              ひとことメモ（任意）
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="このスポットの思い出を書いてみよう..."
              rows={3}
              className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid #2E2E32', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={handleSave}
            disabled={!contributor.trim()}
            className="w-full py-3.5 rounded-xl text-sm font-bold"
            style={contributor.trim()
              ? { background: '#F3B4E3', color: '#F8F9FA' }
              : { background: '#F0F0F5', color: '#8E8E93' }
            }>
            投稿する
          </button>
        </div>
      </div>
    </div>
  )
}
