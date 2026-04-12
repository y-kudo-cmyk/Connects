'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  seventeenMembers,
  SpotPlatform,
  SpotGenre,
  spotGenreConfig,
  getMapUrl,
  getMapAppName,
  isSpotComplete,
} from '@/lib/config/constants'
import { APPROVAL_THRESHOLD, type SpotGenre as SpotGenreType, spotGenreConfig as genreConfig } from '@/lib/config/tags'
import { useVoting } from '@/lib/supabase/useVoting'
import type { AppSpot } from '@/lib/supabase/adapters'
import type { SpotPhoto } from '@/lib/useSpotPhotos'
import EventCard from '@/components/EventCard'
import { useSupabaseData } from '@/components/SupabaseDataProvider'
import { useFavoriteSpots } from '@/lib/useFavoriteSpots'
import { useSpotPhotos } from '@/lib/useSpotPhotos'
import { compressImage } from '@/lib/useMyEntries'
import { useProfile } from '@/lib/useProfile'
import { useAuth } from '@/lib/supabase/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useToday } from '@/lib/useToday'
import { useTranslations } from 'next-intl'

const SpotMap = dynamic(() => import('@/components/SpotMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#EEF0F5' }}>
      <div className="flex flex-col items-center gap-2" style={{ color: '#8E8E93' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-40">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
        <span className="text-xs">Loading...</span>
      </div>
    </div>
  ),
})


const PLATFORM_CONFIG: Record<SpotPlatform, { label: string; color: string; icon: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C', icon: '📸' },
  weverse:   { label: 'Weverse',   color: '#02D1AC', icon: '🎵' },
  x:         { label: 'X',         color: '#1C1C1E', icon: '𝕏' },
  other:     { label: 'Other',     color: '#636366', icon: '🔗' },
}

const ALL_TAGS = ['SEVENTEEN', ...seventeenMembers.map((m) => m.name)]

export default function MapPage() {
  const TODAY = useToday()
  const t = useTranslations()
  const { events, spots: allSpots, refreshSpots } = useSupabaseData()
  const [search, setSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState('ALL')
  const [limitedFilter, setLimitedFilter] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewSpot, setPreviewSpot] = useState<AppSpot | null>(null)
  const [detailSpot, setDetailSpot] = useState<AppSpot | null>(null)
  const [uploadSpot, setUploadSpot] = useState<AppSpot | null>(null)
  const [showNewSpot, setShowNewSpot] = useState(false)
  const [favOnly, setFavOnly] = useState(false)
  const { profile } = useProfile()
  const { toggle, isFavorite } = useFavoriteSpots()
  const { photoMap, addPhoto, removePhoto, votePhoto, getPhotos, getConfirmedCount } = useSpotPhotos()
  const filtered = limitedFilter ? [] : allSpots.filter((spot) => {
    if (favOnly && !isFavorite(spot.id)) return false
    if (search) {
      const q = search.toLowerCase()
      const matchName = spot.name.toLowerCase().includes(q)
      const matchDesc = spot.description.toLowerCase().includes(q)
      const matchMember = spot.members.some((m) => m.toLowerCase().includes(q))
      const matchAddress = spot.address.toLowerCase().includes(q)
      if (!matchName && !matchDesc && !matchMember && !matchAddress) return false
    }
    if (memberFilter !== 'ALL') {
      const filterUpper = memberFilter.toUpperCase()
      if (!spot.members.includes('ALL') && !spot.members.some((m) => m.toUpperCase() === filterUpper)) return false
    }
    return true
  })

  const activeScheduleEvents = useMemo(() => {
    const today = TODAY
    return events.filter((e) =>
      e.tags?.some((t) => t === 'POPUP' || t === 'EVENT') &&
      (e.dateEnd ? e.date <= today && today <= e.dateEnd : e.date === today)
    )
  }, [])

  const incompleteIds = useMemo(() => {
    const set = new Set<string>()
    allSpots.forEach((spot) => {
      if (!isSpotComplete(spot, getConfirmedCount(spot.id))) {
        set.add(spot.id)
      }
    })
    return set
  }, [allSpots, photoMap, getConfirmedCount])

  const handleSpotSelect = useCallback((id: string) => {
    setSelectedId(id)
    const spot = allSpots.find((s) => s.id === id)
    if (spot) setPreviewSpot(spot)
  }, [allSpots])

  // 詳細画面表示中
  if (detailSpot) {
    return (
      <>
        <SpotDetailScreen
          spot={detailSpot}
          isFavorite={isFavorite(detailSpot.id)}
          onToggleFav={() => toggle(detailSpot.id)}
          userPhotos={getPhotos(detailSpot.id)}
          onRemovePhoto={(photoId) => removePhoto(detailSpot.id, photoId)}
          onConfirmPhoto={(photoId) => votePhoto(detailSpot.id, photoId)}
          onOpenUpload={() => setUploadSpot(detailSpot)}
          isIncomplete={incompleteIds.has(detailSpot.id)}
          onClose={() => setDetailSpot(null)}
          onMemberFilter={(name) => { setMemberFilter(name); setDetailSpot(null) }}
          onRefresh={refreshSpots}
        />
        {uploadSpot && (
          <PhotoUploadModal
            spot={uploadSpot}
            defaultContributor={profile.nickname || t('Common.user')}
            onSave={(photo) => { addPhoto(uploadSpot.id, { ...photo, status: 'pending', votes: 0 }); setUploadSpot(null) }}
            onClose={() => setUploadSpot(null)}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>

      {/* Header */}
      <header
        className="flex-shrink-0 px-4 pb-2"
        style={{
          background: '#F8F9FA',
          borderBottom: '1px solid #E5E5EA',
          paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-black tracking-wider" style={{ color: '#1C1C1E' }}>MAP</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewSpot(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(243,180,227,0.15)', border: '1px dashed rgba(243,180,227,0.5)', color: '#C97AB8' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('Map.spotRegister')}
            </button>
            <span className="text-xs font-bold px-2.5 py-1.5 rounded-full"
              style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}>
              {limitedFilter ? `${activeScheduleEvents.length}${t('Map.countSuffix')}` : `${filtered.length}${t('Map.countSuffix')}`}
            </span>
          </div>
        </div>
        {/* Search */}
        <div className="relative mb-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (e.target.value) { setMemberFilter('ALL'); setLimitedFilter(false) } }}
            placeholder={t('Map.searchSpot')}
            className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FFFFFF', color: '#1C1C1E', border: '1px solid #2E2E32' }}
          />
        </div>
        {/* フィルター */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => { setMemberFilter('ALL'); setLimitedFilter(false); setFavOnly(false) }}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={memberFilter === 'ALL' && !limitedFilter && !favOnly
              ? { background: '#F3B4E3', color: '#FFFFFF' }
              : { background: '#FFFFFF', color: '#636366' }
            }>
            {t('Map.everyone')}
          </button>
          <button onClick={() => { setFavOnly((v) => !v); setLimitedFilter(false) }}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1"
            style={favOnly
              ? { background: '#FB7185', color: '#FFFFFF' }
              : { background: 'rgba(251,113,133,0.1)', color: '#FB7185' }
            }>
            <svg width="12" height="12" viewBox="0 0 24 24" fill={favOnly ? '#FFFFFF' : '#FB7185'} stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            {t('Map.favorites')}
          </button>
          {activeScheduleEvents.length > 0 && (
            <button onClick={() => { setLimitedFilter((v) => !v); setMemberFilter('ALL') }}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1"
              style={limitedFilter
                ? { background: '#FB923C', color: '#FFFFFF' }
                : { background: 'rgba(251,146,60,0.12)', color: '#FB923C' }
              }>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'currentColor' }} />
              {t('Map.limited')}
            </button>
          )}
          {seventeenMembers.map((m) => (
            <button key={m.id} onClick={() => { setMemberFilter(m.name); setLimitedFilter(false) }}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={memberFilter === m.name && !limitedFilter
                ? { background: m.color, color: '#1C1C1E' }
                : { background: '#FFFFFF', color: '#636366' }
              }>
              {m.name}
            </button>
          ))}
        </div>
      </header>


      {/* Map */}
      <div className="flex-shrink-0 relative" style={{ height: 320 }}>
        <SpotMap
          spots={filtered}
          selectedId={selectedId}
          onSpotClick={handleSpotSelect}
          incompleteIds={incompleteIds}
        />
        {/* ピンタップ時プレビューカード */}
        {previewSpot && (
          <div className="absolute bottom-3 left-3 right-3" style={{ zIndex: 1000 }}>
            <button
              className="w-full text-left"
              onClick={() => { setDetailSpot(previewSpot); setPreviewSpot(null) }}
            >
              <div className="rounded-2xl flex items-center gap-3 p-3"
                style={{ background: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#F0F0F5' }}>
                  {previewSpot.photos?.[0]?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewSpot.photos[0].imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📍</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#1C1C1E' }}>{previewSpot.name}</p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: '#8E8E93' }}>{previewSpot.address}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
            <button
              onClick={() => { setPreviewSpot(null); setSelectedId(null) }}
              className="absolute -top-2 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: '#1C1C1F', border: '1px solid #3A3A3E', zIndex: 1001 }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* リスト（ピンタップ中は非表示） */}
      {!previewSpot && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-3 pb-28 flex flex-col gap-3">
            {limitedFilter ? (
              activeScheduleEvents.map((event) => (
                <div key={event.id}>
                  <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E5EA' }}>
                    <EventCard event={event} />
                  </div>
                  {!event.venue && (
                    <div className="mt-1.5 rounded-xl px-3 py-2 flex items-center gap-2"
                      style={{ background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.3)' }}>
                      <span className="text-[10px] font-bold" style={{ color: '#F59E0B' }}>！</span>
                      <p className="text-[11px]" style={{ color: '#8E8E93' }}>
                        {t('Map.noAddress')}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-14" style={{ color: '#8E8E93' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mb-2 opacity-30">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <p className="text-sm">{t('Map.spotNotFound')}</p>
              </div>
            ) : (
              <>
                {filtered.map((spot) => {
                  const isSelected = selectedId === spot.id
                  const fav = isFavorite(spot.id)
                  const incomplete = incompleteIds.has(spot.id)
                  const userPhotos = getPhotos(spot.id)
                  const seedUrls = new Set((spot.photos ?? []).map((p) => p.imageUrl).filter(Boolean))
                  const userOnly = userPhotos.filter((p) => !seedUrls.has(p.imageUrl))
                  const totalPhotos = seedUrls.size + userOnly.length
                  return (
                    <div key={spot.id} className="rounded-xl overflow-hidden relative"
                      style={{
                        background: '#FFFFFF',
                        border: `1px solid ${isSelected ? 'rgba(243,180,227,0.6)' : 'transparent'}`,
                      }}>
                      <div onClick={() => { handleSpotSelect(spot.id); setDetailSpot(spot) }}
                        className="flex items-center gap-3 px-3 py-3 pr-20 cursor-pointer">
                        {/* サムネイル */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#F0F0F5' }}>
                          {spot.photos?.[0]?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={spot.photos[0].imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">📍</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: '#F0F0F5', color: '#636366' }}>{spot.city}</span>
                            {totalPhotos > 0 && (
                              <span className="text-[10px] font-bold flex items-center gap-0.5"
                                style={{ color: '#F3B4E3' }}>📷 {totalPhotos}</span>
                            )}
                            {(incomplete || !spot.sourceUrl || !spot.officialUrl) && (
                              <span className="text-[10px] font-bold" style={{ color: '#F59E0B' }}>！</span>
                            )}
                          </div>
                          <p className="text-sm font-bold leading-tight truncate" style={{ color: '#1C1C1E' }}>{spot.name}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: '#8E8E93' }}>{spot.address}</p>
                          {/* HP */}
                          {spot.officialUrl && (
                            <p className="text-[10px] mt-0.5 truncate flex items-center gap-1" style={{ color: '#60A5FA' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                              </svg>
                              HP
                            </p>
                          )}
                          {/* メンバータグ */}
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {spot.members.includes('ALL') ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: '#3B82F610', color: '#3B82F6' }}>{t('Map.allMembers')}</span>
                            ) : spot.members.slice(0, 3).map((name) => {
                              const m = seventeenMembers.find((x) => x.name === name)
                              return (
                                <span key={name} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: (m?.color ?? '#9A9A9F') + '18', color: m?.color ?? '#9A9A9F' }}>
                                  {name}
                                </span>
                              )
                            })}
                            {!spot.members.includes('ALL') && spot.members.length > 3 && (
                              <span className="text-[9px] font-bold" style={{ color: '#8E8E93' }}>+{spot.members.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* マップボタン */}
                      <a
                        href={getMapUrl(spot)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center rounded-full"
                        style={{ background: (spot.city === 'Seoul' || spot.city === 'Busan' || spot.city === 'Incheon') ? '#03C75A20' : '#4285F420' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke={(spot.city === 'Seoul' || spot.city === 'Busan' || spot.city === 'Incheon') ? '#03C75A' : '#4285F4'}
                          strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </a>
                      <button
                        onClick={() => toggle(spot.id)}
                        className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full"
                        style={{ background: fav ? 'rgba(251,113,133,0.15)' : 'transparent' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? '#FB7185' : 'none'} stroke={fav ? '#FB7185' : '#C7C7CC'} strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* 新規スポット投稿モーダル */}
      {showNewSpot && (
        <NewSpotModal
          defaultContributor={profile.nickname || t('Common.user')}
          onClose={() => setShowNewSpot(false)}
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
  spot, isFavorite, onToggleFav, userPhotos, onRemovePhoto, onConfirmPhoto, onOpenUpload, isIncomplete, onClose, onMemberFilter, onRefresh,
}: {
  spot: AppSpot
  isFavorite: boolean
  onToggleFav: () => void
  userPhotos: SpotPhoto[]
  onRemovePhoto: (id: string) => void
  onConfirmPhoto: (id: string) => void
  onOpenUpload: () => void
  isIncomplete: boolean
  onClose: () => void
  onMemberFilter: (name: string) => void
  onRefresh?: () => Promise<void>
}) {
  const t = useTranslations()
  const { user } = useAuth()
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlSubmitted, setUrlSubmitted] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editName, setEditName] = useState(spot.name)
  const [editAddress, setEditAddress] = useState(spot.address)
  const [editGenre, setEditGenre] = useState(spot.genre.toUpperCase())
  const [editOfficialUrl, setEditOfficialUrl] = useState(spot.officialUrl ?? '')

  const ALL_GENRE_KEYS: SpotGenreType[] = ['CAFE', 'RESTAURANT', 'FASHION', 'ENTERTAINMENT', 'MUSIC', 'OTHER']

  const handleEditSave = async () => {
    setEditSaving(true)

    // サーバーAPI経由で更新（RLSバイパス）
    const updates: Record<string, unknown> = {
      spot_name: editName,
      spot_address: editAddress,
      genre: editGenre,
      spot_url: editOfficialUrl || null,
    }

    await fetch('/api/update-spot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotId: spot.id, updates }),
    })

    await onRefresh?.()
    setEditSaving(false)
    setEditing(false)
  }

  const mapUrl = getMapUrl(spot)
  const mapName = getMapAppName(spot)
  const isKorea = spot.city === 'Seoul' || spot.city === 'Busan' || spot.city === 'Incheon'
  const seedPhotos: SpotPhoto[] = (spot.photos ?? []).map((p) => ({ ...p, imageUrl: p.imageUrl ?? '', sourceUrl: p.sourceUrl ?? '', platform: p.platform ?? '', status: 'confirmed' as const }))
  const allPhotos: SpotPhoto[] = [...seedPhotos, ...userPhotos]
  const pendingPhotos = userPhotos.filter((p) => p.status === 'pending')
  // Remove duplicate photos (same imageUrl)
  const seen = new Set<string>()
  const confirmedPhotos = allPhotos.filter((p) => {
    if (p.status !== 'confirmed') return false
    if (!p.imageUrl) return true
    if (seen.has(p.imageUrl)) return false
    seen.add(p.imageUrl)
    return true
  })

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    try {
      const existing = JSON.parse(localStorage.getItem('cp-url-submissions') || '[]')
      existing.push({ spotId: spot.id, spotName: spot.name, url: urlInput.trim(), type: 'officialUrl', createdAt: new Date().toISOString(), status: 'pending' })
      localStorage.setItem('cp-url-submissions', JSON.stringify(existing))
    } catch {}
    setUrlSubmitted(true)
    setTimeout(() => { setShowUrlInput(false); setUrlSubmitted(false); setUrlInput('') }, 1500)
  }

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
          <p className="text-sm font-black tracking-wider" style={{ color: '#1C1C1E' }}>MAP</p>
        </div>
        {user && !editing && (
          <button onClick={() => setEditing(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
            style={{ background: '#F0F0F5', border: '1px solid #E5E5EA' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        <button onClick={onToggleFav}
          className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
          style={{ background: isFavorite ? 'rgba(251,113,133,0.15)' : '#FFFFFF', border: '1px solid #E5E5EA' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? '#FB7185' : 'none'} stroke={isFavorite ? '#FB7185' : '#8E8E93'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 flex flex-col gap-4">

          {/* ── 基本情報 ── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }}>
            <div className="px-4 py-4">
              {editing ? (
                <div className="flex flex-col gap-3">
                  {/* スポット名 */}
                  <div>
                    <label className="text-xs font-bold mb-1.5 block" style={{ color: '#636366' }}>{t('Map.spotName')}</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none"
                      style={{ color: '#1C1C1E', background: '#FFFFFF', border: '1.5px solid #F3B4E3' }} />
                  </div>
                  {/* 住所 */}
                  <div>
                    <label className="text-xs font-bold mb-1.5 block" style={{ color: '#636366' }}>{t('Map.address')}</label>
                    <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ color: '#1C1C1E', background: '#FFFFFF', border: '1.5px solid #F3B4E3' }} />
                  </div>
                  {/* ジャンル */}
                  <div>
                    <label className="text-xs font-bold mb-1.5 block" style={{ color: '#636366' }}>{t('Map.genre')}</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_GENRE_KEYS.map((g) => {
                        const gc = genreConfig[g]
                        const selected = editGenre === g
                        return (
                          <button key={g} onClick={() => setEditGenre(g)}
                            className="px-3 py-1.5 rounded-full text-xs font-bold"
                            style={selected
                              ? { background: gc.color, color: '#FFFFFF' }
                              : { background: gc.bg, color: gc.color }
                            }>
                            {gc.icon} {gc.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {/* 公式URL */}
                  <div>
                    <label className="text-xs font-bold mb-1.5 block" style={{ color: '#636366' }}>{t('Map.officialUrl')}</label>
                    <input type="url" value={editOfficialUrl} onChange={(e) => setEditOfficialUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ color: '#1C1C1E', background: '#FFFFFF', border: '1.5px solid #F3B4E3' }} />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-base font-black mb-1" style={{ color: '#1C1C1E' }}>{spot.name}</p>
                  {spot.nameLocal && spot.nameLocal !== spot.name && (
                    <p className="text-sm font-semibold mb-1" style={{ color: '#636366' }}>{spot.nameLocal}</p>
                  )}
                  <p className="text-sm mb-2" style={{ color: '#8E8E93' }}>📍 {spot.address}</p>
                  {isIncomplete && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>{t('Map.infoWanted')}</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 編集モード: 保存 / キャンセル */}
          {editing && (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setEditName(spot.name); setEditAddress(spot.address); setEditGenre(spot.genre.toUpperCase()); setEditOfficialUrl(spot.officialUrl ?? '') }}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold"
                style={{ background: '#F0F0F5', color: '#636366' }}>
                {t('Common.cancel')}
              </button>
              <button onClick={handleEditSave} disabled={editSaving}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold"
                style={{ background: '#34D399', color: '#FFFFFF' }}>
                {editSaving ? t('Common.saving') : t('Map.saveEdit')}
              </button>
            </div>
          )}

          {/* マップ・HP */}
          <div className="flex gap-3">
            <a href={mapUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
              style={{ background: isKorea ? '#03C75A' : '#4285F4', color: '#FFFFFF' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              MAP
            </a>
            {spot.officialUrl ? (
              <a href={spot.officialUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: '#FFFFFF', color: '#1C1C1E', border: '1px solid #E5E5EA' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                </svg>
                HP
              </a>
            ) : (
              <button onClick={() => setShowUrlInput(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-2xl text-sm font-bold"
                style={{ background: '#FFFFFF', color: '#F59E0B', border: '1px dashed rgba(245,158,11,0.5)' }}>
                <div className="flex items-center gap-1">
                  <span className="text-xs">！</span>
                  {t('Map.hpWanted')}
                </div>
              </button>
            )}
          </div>

          {/* URL投稿インライン */}
          {showUrlInput && (
            <div className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA' }}>
              {urlSubmitted ? (
                <div className="flex items-center gap-2 justify-center py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-sm font-bold" style={{ color: '#34D399' }}>{t('Map.submitted')}</p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold" style={{ color: '#636366' }}>{t('Map.hpUrlPrompt')}</p>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                    style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowUrlInput(false)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                      style={{ background: '#F0F0F5', color: '#636366' }}>
                      {t('Common.cancel')}
                    </button>
                    <button onClick={handleUrlSubmit}
                      disabled={!urlInput.trim()}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                      style={{
                        background: urlInput.trim() ? '#F3B4E3' : '#E5E5EA',
                        color: urlInput.trim() ? '#FFFFFF' : '#8E8E93',
                      }}>
                      {t('Map.submitApproval')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* ── 写真ギャラリー ── */}
        <div className="mt-4 mb-2 px-4">
          <p className="text-xs font-semibold mb-2" style={{ color: '#8E8E93' }}>{t('Map.photos')}</p>
        </div>
        <div className="pb-4">
          {confirmedPhotos.length === 0 ? (
            <div className="mx-4">
              <button onClick={onOpenUpload}
                className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 p-4"
                style={{ height: 160, background: '#F0F0F5', border: '1px dashed #C7C7CC' }}>
                {spot.description && (
                  <span className="text-xs font-semibold text-center mb-1" style={{ color: '#636366' }}>{spot.description}</span>
                )}
                <span className="text-sm font-semibold" style={{ color: '#8E8E93' }}>画像を追加してください</span>
                <span className="text-3xl">📷</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2 px-4 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
              {confirmedPhotos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo}
                  isUserPhoto={userPhotos.some((p) => p.id === photo.id)}
                  onRemove={() => onRemovePhoto(photo.id)}
                  spotId={spot.id}
                  spotMemo={spot.description}
                  spotContributor={spot.submittedByName}
                  onSavePhoto={onRefresh}
                  onVotePhoto={(photoId) => onConfirmPhoto(photoId)} />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 flex flex-col gap-4 pb-28">

          {/* 承認待ち写真 */}
          {pendingPhotos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>{t('Map.pendingLabel')}</span>
                <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>{t('Map.pendingPhotos')} {pendingPhotos.length}{t('My.pendingCount')}</p>
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

          {/* 写真を投稿するボタン */}
          <button onClick={onOpenUpload}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #F3B4E3, #C97AB8)', color: '#FFFFFF' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('Map.uploadPhoto')}
          </button>

        </div>

        {/* スクロール余白（タブバーに被らないように） */}
        <div style={{ height: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} />
      </div>

    </div>
  )
}

// ─── 写真カード ─────────────────────────────────────────────
function PhotoCard({
  photo, isUserPhoto, onRemove, spotId, spotMemo, spotContributor, onSavePhoto, onVotePhoto,
}: {
  photo: SpotPhoto
  isUserPhoto: boolean
  onRemove: () => void
  spotId: string
  spotMemo?: string
  spotContributor?: string
  onSavePhoto?: () => Promise<void>
  onVotePhoto?: (photoId: string) => void
}) {
  const t = useTranslations()
  const [showEdit, setShowEdit] = useState(false)
  const [editSourceUrl, setEditSourceUrl] = useState(photo.sourceUrl || '')
  const [editDate, setEditDate] = useState(photo.date || '')
  const [editMembers, setEditMembers] = useState<string[]>(photo.tags?.filter(t => t !== 'SEVENTEEN') || [])
  const [saving, setSaving] = useState(false)
  const [savedSourceUrl, setSavedSourceUrl] = useState(photo.sourceUrl)
  const [savedTags, setSavedTags] = useState(photo.tags || [])
  const [savedDate, setSavedDate] = useState(photo.date || '')
  const effectiveSourceUrl = savedSourceUrl || photo.sourceUrl

  const toggleMember = (name: string) => {
    setEditMembers(prev => prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name])
  }

  const handleSave = async () => {
    setSaving(true)
    const tags = editMembers.length > 0
      ? '#SEVENTEEN ' + editMembers.map(m => `#${m}`).join(' ')
      : '#SEVENTEEN'
    await fetch('/api/update-spot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId: photo.id,
        spotId,
        updates: {
          source_url: editSourceUrl || null,
          visit_date: editDate || null,
          tags,
        },
      }),
    })
    setSavedSourceUrl(editSourceUrl)
    setSavedTags(['SEVENTEEN', ...editMembers])
    setSavedDate(editDate)
    await onSavePhoto?.()
    setSaving(false)
    setShowEdit(false)
  }

  return (
    <div className="flex-shrink-0 rounded-xl overflow-hidden flex flex-col"
      style={{ width: 'calc(50vw - 20px)', minWidth: 'calc(50vw - 20px)', background: '#F0F0F5' }}>
      {/* 画像 — タップでソースURLへ */}
      <div className="relative overflow-hidden"
        onClick={() => { if (effectiveSourceUrl) window.open(effectiveSourceUrl, '_blank') }}
        style={{ cursor: effectiveSourceUrl ? 'pointer' : 'default' }}>
        {photo.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.imageUrl} alt="" className="w-full" style={{ display: 'block' }} />
        ) : (
          <div className="w-full flex items-center justify-center" style={{ height: 120, background: 'linear-gradient(135deg, #1C1C1F 0%, #252528 100%)' }}>
            <span className="text-3xl opacity-30">📷</span>
          </div>
        )}
        {/* ソースありアイコン（左下） */}
        {effectiveSourceUrl && (
          <div className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
        )}
        {/* 編集ボタン（右下） */}
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEdit(true) }}
          className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
      {/* タグ + 日付 */}
      <div className="px-2 py-2 flex flex-col gap-1">
        {savedTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {savedTags.map((tag) => {
              const m = seventeenMembers.find((x) => x.name === tag)
              const isSVT = tag === 'SEVENTEEN'
              return (
                <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: isSVT ? '#3B82F615' : (m?.color ?? '#9A9A9F') + '18',
                    color: isSVT ? '#3B82F6' : m?.color ?? '#9A9A9F',
                  }}>
                  #{tag}
                </span>
              )
            })}
          </div>
        )}
        <p className="text-[10px] leading-tight" style={{ color: '#8E8E93' }}>
          {(savedDate || photo.date || '').replace(/-/g, '/')}
        </p>
        {(photo.contributor || spotContributor) && (
          <p className="text-[9px] font-semibold" style={{ color: '#B0B0B5' }}>👤 {photo.contributor || spotContributor}</p>
        )}
        {!effectiveSourceUrl && (
          <div className="flex items-center gap-1 mt-1" style={{ color: '#F59E0B' }}>
            <span className="text-[9px]">！</span>
            <span className="text-[9px] font-bold">{t('Map.addSourceUrl')}</span>
          </div>
        )}
        {(photo.caption || spotMemo) && (
          <p className="text-[9px] leading-tight mt-0.5" style={{ color: '#8E8E93' }}>{photo.caption || spotMemo}</p>
        )}
        {/* 写真承認ボタン */}
        {onVotePhoto && (() => {
          const hasMembers = savedTags.some(t => t !== 'SEVENTEEN')
          const hasSource = !!effectiveSourceUrl
          const isComplete = hasMembers && hasSource
          const isApproved = photo.status === 'confirmed' && (photo.votes ?? 0) >= 3
          if (isApproved) return (
            <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>✓ 承認済</span>
          )
          return (
            <button onClick={(e) => { e.stopPropagation(); if (isComplete) onVotePhoto(photo.id) }}
              disabled={!isComplete}
              className="inline-flex items-center gap-0.5 mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={!isComplete
                ? { background: '#F0F0F5', color: '#8E8E93' }
                : { background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }
              }>
              {!isComplete ? '⚠' : '👍'} {photo.votes ?? 0}/3
            </button>
          )
        })()}
      </div>
      {/* 写真編集モーダル */}
      {showEdit && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6" onClick={() => setShowEdit(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
          <div className="relative w-full max-w-sm rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: '#F8F9FA' }}
            onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>写真を編集</p>
            {/* メンバータグ */}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#636366' }}>メンバー</label>
              <div className="flex flex-wrap gap-1.5">
                {seventeenMembers.map((m) => {
                  const selected = editMembers.includes(m.name)
                  return (
                    <button key={m.id} onClick={() => toggleMember(m.name)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                      style={selected
                        ? { background: m.color, color: '#FFFFFF' }
                        : { background: m.color + '18', color: m.color }
                      }>
                      {m.name}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* ソースURL */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#636366' }}>ソースURL</label>
              <input type="url" value={editSourceUrl} onChange={(e) => setEditSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
            </div>
            {/* 訪問日 */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#636366' }}>訪問日</label>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
            </div>
            {/* ボタン */}
            <div className="flex gap-2">
              {effectiveSourceUrl && (
                <a href={effectiveSourceUrl} target="_blank" rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl text-sm font-bold text-center"
                  style={{ background: '#F0F0F5', color: '#636366' }}>
                  ↗
                </a>
              )}
              <button onClick={() => setShowEdit(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#F0F0F5', color: '#636366' }}>
                {t('Common.cancel')}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#F3B4E3', color: '#FFF' }}>
                {saving ? t('Common.saving') : t('Common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 写真投稿モーダル ───────────────────────────────────────
function PhotoUploadModal({
  spot, defaultContributor, onSave, onClose,
}: {
  spot: AppSpot
  defaultContributor: string
  onSave: (photo: SpotPhoto) => void
  onClose: () => void
}) {
  const t = useTranslations()
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined)
  const [sourceUrl, setSourceUrl] = useState('')
  const [platform, setPlatform] = useState<SpotPlatform>('instagram')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const today = useToday()
  const [date, setDate] = useState(today)
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
    const photo: SpotPhoto = {
      id: Date.now().toString(),
      imageUrl: imageDataUrl ?? '',
      sourceUrl: sourceUrl.trim() || '',
      platform,
      tags: selectedTags,
      contributor: defaultContributor,
      date,
      caption: caption.trim() || undefined,
      status: 'pending',
      votes: 0,
    }
    onSave(photo)
  }

  const memberColors: Record<string, string> = Object.fromEntries(
    seventeenMembers.map((m) => [m.name, m.color])
  )

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose} />
      <div className="relative flex flex-col rounded-t-2xl" style={{ background: '#FFFFFF', maxHeight: '92vh' }}>
        {/* Handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #E5E5EA' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{t('Map.photoUploadTitle')}</p>
            <p className="text-[11px] mt-0.5" style={{ color: '#8E8E93' }}>{spot.name}</p>
          </div>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4">

          {/* 画像 */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>{t('Map.photoLabel')}</label>
            {imageDataUrl ? (
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDataUrl} alt="" className="w-full h-full object-contain" style={{ background: '#000' }} />
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
                className="w-full h-32 rounded-xl flex flex-col items-center justify-center gap-2"
                style={{ border: '2px dashed #E5E5EA', color: '#8E8E93' }}>
                <span className="text-3xl">📷</span>
                <span className="text-xs">{t('Map.photoAdd')}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleImagePick(e.target.files)} />
          </div>

          {/* 来店日 */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>{t('Map.photoVisitDate')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }}
            />
          </div>

          {/* メンバー（複数選択可） */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              {t('Map.newSpotMember')} <span style={{ color: '#8E8E93', fontWeight: 400 }}>（{t('Map.newSpotMemberSub')}）</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {seventeenMembers.map((m) => {
                const sel = selectedTags.includes(m.name)
                return (
                  <button key={m.name} onClick={() => toggleTag(m.name)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={sel
                      ? { background: m.color + '30', color: m.color, border: `1px solid ${m.color}60` }
                      : { background: '#F0F0F5', color: '#8E8E93', border: '1px solid #E5E5EA' }
                    }>
                    {m.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ソースURL */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              {t('Map.photoSourceUrl')} <span style={{ color: '#8E8E93', fontWeight: 400 }}>（{t('Map.photoSourceUrlSub')}）</span>
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }}
            />
          </div>

          {/* メモ */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              {t('Map.photoMemo')} <span style={{ color: '#8E8E93', fontWeight: 400 }}>（{t('Map.photoMemoSub')}）</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t('Map.photoMemoPlaceholder')}
              rows={2}
              className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }}
            />
          </div>

          {/* 投稿ボタン */}
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl text-sm font-bold min-h-[52px]"
            style={{ background: '#F3B4E3', color: '#FFFFFF' }}>
            {t('Common.submit')}
          </button>

          <div className="flex-shrink-0" style={{ height: 200 }} />
        </div>

      </div>
    </div>
  )
}

// ─── 新規スポット投稿モーダル ──────────────────────────────
function NewSpotModal({
  defaultContributor, onClose,
}: {
  defaultContributor: string
  onClose: () => void
}) {
  const t = useTranslations()
  const [name, setName] = useState('')
  const [nameLocal, setNameLocal] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [genre, setGenre] = useState<SpotGenre>('cafe')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [officialUrl, setOfficialUrl] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined)
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>(undefined)
  const fileRef = useRef<HTMLInputElement>(null)
  const ssFileRef = useRef<HTMLInputElement>(null)
  const [submitted, setSubmitted] = useState(false)

  const toggleMember = (name: string) => {
    setSelectedMembers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const handleImagePick = async (files: FileList | null) => {
    if (!files || !files[0]) return
    const url = await compressImage(files[0], 1200, 0.85)
    setImageDataUrl(url)
  }

  const handleScreenshotPick = async (files: FileList | null) => {
    if (!files || !files[0]) return
    const url = await compressImage(files[0], 1200, 0.85)
    setScreenshotUrl(url)
  }

  const handleSubmit = () => {
    if (!name.trim() || !address.trim() || !imageDataUrl) return
    // ローカルストレージに保存
    try {
      const existing = JSON.parse(localStorage.getItem('cp-new-spots') || '[]')
      existing.push({
        id: `user-spot-${Date.now()}`,
        name: name.trim(),
        nameLocal: nameLocal.trim() || name.trim(),
        address: address.trim(),
        city: city.trim(),
        genre,
        members: selectedMembers.length > 0 ? selectedMembers : ['ALL'],
        description: description.trim(),
        officialUrl: officialUrl.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        imageUrl: imageDataUrl,
        screenshotUrl: screenshotUrl,
        contributor: defaultContributor,
        createdAt: new Date().toISOString(),
        status: 'pending',
      })
      localStorage.setItem('cp-new-spots', JSON.stringify(existing))
    } catch {}
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6" style={{ background: '#F8F9FA' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(52,211,153,0.15)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-base font-bold mb-1" style={{ color: '#1C1C1E' }}>{t('Map.newSpotSubmitted')}</p>
        <p className="text-sm text-center mb-4" style={{ color: '#8E8E93' }}>
          {t('Map.newSpotReview')}
        </p>
        <button onClick={onClose}
          className="w-full max-w-xs py-3.5 rounded-2xl text-sm font-bold"
          style={{ background: '#F3B4E3', color: '#FFFFFF' }}>
          {t('Common.close')}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-hidden" style={{ background: '#F8F9FA' }}>
      <div
        className="flex-shrink-0 flex items-center justify-between px-4"
        style={{
          background: '#F8F9FA',
          borderBottom: '1px solid #E5E5EA',
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          paddingBottom: 12,
        }}
      >
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: '#FFFFFF', border: '1px solid #E5E5EA' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{t('Map.newSpotTitle')}</p>
        <div style={{ width: 36 }}></div>
      </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* スクリーンショット（最上部） */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              {t('Map.newSpotScreenshot')} <span style={{ color: '#8E8E93', fontWeight: 400 }}>（{t('Map.newSpotScreenshotSub')}）</span>
            </label>
            {screenshotUrl ? (
              <div className="relative rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={screenshotUrl} alt="" className="w-full rounded-xl" style={{ display: 'block' }} />
                <button onClick={() => setScreenshotUrl(undefined)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <button onClick={() => ssFileRef.current?.click()}
                className="w-full h-32 rounded-xl flex flex-col items-center justify-center gap-2"
                style={{ border: '2px dashed #E5E5EA', color: '#8E8E93' }}>
                <span className="text-3xl">📱</span>
                <span className="text-xs">{t('Map.newSpotScreenshotUpload')}</span>
                <span className="text-[10px]" style={{ color: '#C7C7CC' }}>{t('Map.newSpotScreenshotHint')}</span>
              </button>
            )}
            <input ref={ssFileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleScreenshotPick(e.target.files)} />
          </div>

          {/* スポット名 */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              {t('Map.newSpotName')} <span style={{ color: '#F87171' }}>*</span>
            </label>
            <p className="text-[10px] mb-1.5" style={{ color: '#F59E0B' }}>{t('Map.newSpotNameHint')}</p>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="例: 하이브 인사이트"
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }} />
          </div>

          {/* 現地語名 */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              {t('Map.newSpotLocalName')} <span style={{ color: '#8E8E93', fontWeight: 400 }}>（{t('Map.newSpotLocalNameSub')}）</span>
            </label>
            <input type="text" value={nameLocal} onChange={(e) => setNameLocal(e.target.value)}
              placeholder="例: 하이브 인사이트"
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }} />
          </div>

          {/* 住所 */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              {t('Map.newSpotAddress')} <span style={{ color: '#F87171' }}>*</span>
            </label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="例: ソウル特別市龍山区漢南大路42キル 35"
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }} />
          </div>

          {/* ジャンル */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>{t('Map.newSpotGenre')}</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(spotGenreConfig).map(([key, cfg]) => (
                <button key={key} onClick={() => setGenre(key as SpotGenre)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={genre === key
                    ? { background: cfg.color + '30', color: cfg.color, border: `1px solid ${cfg.color}60` }
                    : { background: '#F0F0F5', color: '#8E8E93', border: '1px solid #E5E5EA' }
                  }>
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* メンバー */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              {t('Map.newSpotMember')} <span style={{ color: '#8E8E93', fontWeight: 400 }}>（{t('Map.newSpotMemberSub')}）</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {seventeenMembers.map((m) => {
                const sel = selectedMembers.includes(m.name)
                return (
                  <button key={m.name} onClick={() => toggleMember(m.name)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={sel
                      ? { background: m.color + '30', color: m.color, border: `1px solid ${m.color}60` }
                      : { background: '#F0F0F5', color: '#8E8E93', border: '1px solid #E5E5EA' }
                    }>
                    {m.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 写真（必須） */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>{t('Map.newSpotPhoto')} <span style={{ color: '#F87171' }}>*</span></label>
            {imageDataUrl ? (
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDataUrl} alt="" className="w-full h-full object-contain" style={{ background: '#000' }} />
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
                className="w-full h-32 rounded-xl flex flex-col items-center justify-center gap-2"
                style={{ border: `2px dashed ${!imageDataUrl ? '#F87171' : '#E5E5EA'}40`, color: '#8E8E93' }}>
                <span className="text-3xl">📷</span>
                <span className="text-xs">{t('Map.newSpotPhotoAdd')}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleImagePick(e.target.files)} />
          </div>

          {/* 公式URL */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              {t('Map.newSpotOfficialUrl')} <span style={{ color: '#8E8E93', fontWeight: 400 }}></span>
            </label>
            <input type="url" value={officialUrl} onChange={(e) => setOfficialUrl(e.target.value)}
              placeholder="https://www.example.com"
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }} />
          </div>

          {/* ソースURL */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              {t('Map.newSpotSourceUrl')} <span style={{ color: '#8E8E93', fontWeight: 400 }}>（{t('Map.newSpotSourceUrlSub')}）</span>
            </label>
            <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="w-full px-3 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }} />
          </div>

          {/* 説明 */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#636366' }}>
              {t('Map.newSpotDesc')} <span style={{ color: '#8E8E93', fontWeight: 400 }}></span>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Map.newSpotDescPlaceholder')}
              rows={3}
              className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#F0F0F5', color: '#1C1C1E', border: '1px solid #E5E5EA' }} />
          </div>

          {/* 投稿ボタン */}
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !address.trim() || !imageDataUrl}
            className="w-full py-4 rounded-2xl text-sm font-bold min-h-[52px]"
            style={{
              background: name.trim() && address.trim() && imageDataUrl ? '#F3B4E3' : '#E5E5EA',
              color: name.trim() && address.trim() && imageDataUrl ? '#FFFFFF' : '#8E8E93',
            }}>
            {t('Common.submit')}
          </button>

          <div className="flex-shrink-0" style={{ height: 200 }} />
        </div>
    </div>
  )
}
