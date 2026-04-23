'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from '@/i18n/navigation'
import { useAuth } from '@/lib/supabase/useAuth'
import { useTranslations } from 'next-intl'
import { usePageView } from '@/lib/useActivityLog'
import { useProfile, FanClubMembership, NotifSettings } from '@/lib/useProfile'
import { uploadDataUrl } from '@/lib/supabase/uploadImage'
import { COUNTRIES, countryFlag } from '@/lib/countryUtils'
import ImageCropModal from '@/components/ImageCropModal'
import { useMyEntries, MyEntry } from '@/lib/useMyEntries'
import { useReferral } from '@/lib/useReferral'
import { createClient } from '@/lib/supabase/client'
import { seventeenMembers } from '@/lib/config/constants'

const LANGUAGES = [
  { code: 'ja' as const, flag: '\u{1F1EF}\u{1F1F5}', label: '\u65E5\u672C\u8A9E' },
  { code: 'en' as const, flag: '\u{1F1FA}\u{1F1F8}', label: 'English' },
  { code: 'ko' as const, flag: '\u{1F1F0}\u{1F1F7}', label: '\uD55C\uAD6D\uC5B4' },
]

// membership_number from profile (e.g. U000001)

import { RANKS, calcScore, getRank } from '@/lib/config/score'

async function loadImage(files: FileList | null): Promise<string | null> {
  if (!files?.[0]) return null
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(files[0])
  })
}

function md(s: string) {
  const d = new Date(s)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// ─── スワイプ削除可能な参戦記録行 ─────────────────────────
function SwipeableConcertRow({
  entry, onOpen, onDelete,
}: {
  entry: MyEntry
  onOpen: () => void
  onDelete: () => void
}) {
  const [offset, setOffset] = useState(0)
  const startX = useRef<number | null>(null)
  const startOffset = useRef(0)
  const currentOffset = useRef(0)
  const moved = useRef(false)
  const DELETE_WIDTH = 72
  const SWIPE_THRESHOLD = 12

  const onStart = (x: number) => {
    startX.current = x
    startOffset.current = offset
    currentOffset.current = offset
    moved.current = false
  }
  const onMove = (x: number) => {
    if (startX.current === null) return
    const dx = x - startX.current
    if (Math.abs(dx) > SWIPE_THRESHOLD) moved.current = true
    const next = Math.max(-DELETE_WIDTH, Math.min(0, startOffset.current + dx))
    currentOffset.current = next
    setOffset(next)
  }
  const onEnd = () => {
    if (startX.current === null) return
    startX.current = null
    const settled = currentOffset.current < -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0
    currentOffset.current = settled
    setOffset(settled)
  }
  const onTap = () => {
    if (moved.current) { moved.current = false; return }
    if (offset === 0) onOpen()
  }

  const d = entry.date ? new Date(entry.date) : null
  const dateStr = d ? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}` : ''
  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, marginBottom: 8, background: '#EF4444', touchAction: 'pan-y' }}
      onTouchStart={(e) => onStart(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchEnd={onEnd}
      onPointerDown={(e) => { if (e.pointerType !== 'touch') onStart(e.clientX) }}
      onPointerMove={(e) => { if (e.pointerType !== 'touch' && startX.current !== null) onMove(e.clientX) }}
      onPointerUp={(e) => { if (e.pointerType !== 'touch') onEnd() }}
    >
      {/* 削除ボタン（右側に露出） */}
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: DELETE_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EF4444' }}>
        <button onClick={() => { onDelete(); setOffset(0) }}
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: 'transparent', border: 'none', color: '#FFF' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 700 }}>削除</span>
        </button>
      </div>

      {/* コンテンツ */}
      <button
        type="button"
        onClick={onTap}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          borderRadius: 12,
          textAlign: 'left',
          width: '100%',
          border: 'none',
          background: '#FFFFFF',
          transform: `translateX(${offset}px)`,
          transition: startX.current === null ? 'transform 0.15s' : 'none',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            flexShrink: 0,
            background: entry.images?.[0]
              ? `url(${entry.images[0]}) center/cover`
              : 'linear-gradient(135deg, rgba(243,180,227,0.2) 0%, rgba(167,139,250,0.15) 100%)',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1E', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.title}</p>
          {entry.subTitle && (
            <p style={{ fontSize: 10, color: '#636366', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.subTitle}</p>
          )}
          <p style={{ fontSize: 10, color: '#8E8E93', margin: 0, marginTop: 2 }}>
            {dateStr}{entry.venue ? ` · ${entry.venue}` : ''}
          </p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}

export default function ProfilePage() {
  usePageView('profile')
  const { profile, update, addFanClub, updateFanClub, removeFanClub } = useProfile()
  const { signOut, user } = useAuth()
  const t = useTranslations()

  const bannerRef = useRef<HTMLInputElement>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput, setBioInput] = useState('')

  const [fcModal, setFcModal] = useState<'new' | string | null>(null)
  const [fcForm, setFcForm] = useState<Partial<FanClubMembership>>({})
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteAgreed, setDeleteAgreed] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [feedbackState, setFeedbackState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [favMemberIds, setFavMemberIds] = useState<string[]>([])
  const [editingOshi, setEditingOshi] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const run = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('profiles').select('fav_member_ids').eq('id', user.id).single()
      if (cancelled) return
      const ids = (data?.fav_member_ids as string[] | null) ?? []
      setFavMemberIds(Array.isArray(ids) ? ids : [])
    }
    void run()
    return () => { cancelled = true }
  }, [user])

  const toggleFavMember = useCallback(async (memberId: string) => {
    if (!user) return
    const prev = favMemberIds
    const next = prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    setFavMemberIds(next) // optimistic
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ fav_member_ids: next }).eq('id', user.id)
    if (error) setFavMemberIds(prev) // revert on error
  }, [user, favMemberIds])
  const [cropTarget, setCropTarget] = useState<'banner' | 'avatar'>('banner')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [notifExpanded, setNotifExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const router = useRouter()
  const [portalMounted, setPortalMounted] = useState(false)
  useEffect(() => { setPortalMounted(true) }, [])

  // Concert history: LIVE entries from my_entries
  const { entries, removeEntry } = useMyEntries()
  const liveEntries = entries.filter((e) => e.tags?.includes('CONCERT') || e.type === 'CONCERT')
  const [showConcerts, setShowConcerts] = useState(false)

  const updateNotif = (patch: Partial<NotifSettings>) =>
    update({ notif: { ...profile.notif, ...patch } })

  const handleSignOut = async () => {
    try { localStorage.clear() } catch {}
    await signOut()
    router.push('/login')
  }

  const sendFeedback = async () => {
    if (!feedbackMsg.trim()) return
    setFeedbackState('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedbackMsg, nickname: profile.nickname }),
      })
      setFeedbackState(res.ok ? 'done' : 'error')
    } catch {
      setFeedbackState('error')
    }
  }

  const handleDeleteAccount = async () => {
    try { localStorage.clear() } catch {}
    await signOut()
    router.push('/login')
  }

  const onBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await loadImage(e.target.files)
    if (url) { setCropTarget('banner'); setCropSrc(url) }
    e.target.value = ''
  }

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await loadImage(e.target.files)
    if (url) { setCropTarget('avatar'); setCropSrc(url) }
    e.target.value = ''
  }

  const [imageUploading, setImageUploading] = useState(false)
  const onCropConfirm = async (dataUrl: string) => {
    setCropSrc(null)
    setImageUploading(true)
    const bucket = cropTarget === 'banner' ? 'banners' : 'avatars'
    const publicUrl = await uploadDataUrl(bucket, dataUrl)
    if (publicUrl) {
      if (cropTarget === 'banner') update({ bannerImage: publicUrl })
      else update({ avatarImage: publicUrl })
    }
    setImageUploading(false)
  }

  const startEditNickname = () => { setNicknameInput(profile.nickname); setEditingNickname(true) }
  const saveNickname = () => { if (nicknameInput.trim()) update({ nickname: nicknameInput.trim() }); setEditingNickname(false) }

  const startEditBio = () => { setBioInput(profile.bio); setEditingBio(true) }
  const saveBio = () => { update({ bio: bioInput }); setEditingBio(false) }

  const openNewFc = () => { setFcForm({ clubName: 'SEVENTEEN' }); setFcModal('new') }
  const openEditFc = (fc: FanClubMembership) => { setFcForm({ ...fc }); setFcModal(fc.id) }
  const saveFc = () => {
    if (!fcForm.clubName || !fcForm.memberNumber) return
    if (fcModal === 'new') {
      addFanClub({ id: Date.now().toString(), clubName: fcForm.clubName, memberNumber: fcForm.memberNumber, mobileMemberNumber: fcForm.mobileMemberNumber, email: fcForm.email, phone: fcForm.phone, validUntil: fcForm.validUntil, note: fcForm.note })
    } else if (fcModal) {
      updateFanClub(fcModal, fcForm)
    }
    setFcModal(null)
  }

  const { stats } = profile
  const score = calcScore(stats)
  const rank = getRank(score)
  const rankIndex = RANKS.findIndex((r) => r.key === rank.key)
  const nextRank = RANKS[rankIndex + 1] ?? null

  return (
    <div className="flex flex-col" style={{ background: '#F8F9FA' }}>

      {/* --- Fixed header with gear button --- */}
      <div
        className="sticky top-0 z-10 flex items-center justify-center relative"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #F0F0F5',
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          paddingBottom: 12,
        }}
      >
        <span className="text-sm font-black tracking-wider" style={{ color: '#1C1C1E' }}>PROFILE</span>
        <button
          onClick={() => setShowSettings(true)}
          className="absolute right-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#F0F0F5' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* --- Banner + Avatar --- */}
      <div className="relative">
        <div
          className="w-full h-48 relative overflow-hidden"
          style={{
            background: profile.bannerImage
              ? undefined
              : 'linear-gradient(135deg, #0f1f3d 0%, #3B82F6 60%, #8B5CF6 100%)',
          }}
        >
          {profile.bannerImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.bannerImage} alt="" className="w-full h-full object-cover" />
          )}
          <button
            onClick={() => bannerRef.current?.click()}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={onBannerChange} />
        </div>

        <div className="absolute left-4" style={{ bottom: -40 }}>
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full overflow-hidden"
              style={{ border: '3px solid #F8F9FA', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
            >
              {profile.avatarImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white">
                  {profile.nickname.slice(0, 1)}
                </div>
              )}
            </div>
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: '#F3B4E3', border: '2px solid #F8F9FA' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </div>
        </div>
      </div>

      <div style={{ height: 52 }} />

      {/* --- User info --- */}
      <div className="px-4 pb-3">
        {editingNickname ? (
          <div className="mb-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nicknameInput}
                autoFocus
                maxLength={20}
                onChange={(e) => setNicknameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
                className="px-3 py-1.5 rounded-lg text-base font-bold outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #F3B4E3', color: '#1C1C1E', width: 180 }}
              />
              <button onClick={saveNickname} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#F3B4E3' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              </button>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: '#EF4444' }}>
              ⚠️ ユーザー名は他のユーザーに表示される可能性があります
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <button className="flex items-center gap-1.5" onClick={startEditNickname}>
                <span className="text-lg font-bold leading-tight" style={{ color: '#1C1C1E' }}>{profile.nickname}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
              {profile.membershipNumber && (
                <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded" style={{ color: '#636366', background: '#F0F0F5' }}>
                  {profile.membershipNumber}
                </span>
              )}
            </div>
            <button
              onClick={startEditNickname}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md mb-2"
              style={{ background: 'rgba(239,68,68,0.08)' }}
            >
              <span className="text-[10px] leading-none" style={{ color: '#EF4444' }}>⚠️ ユーザー名は公開されます</span>
            </button>
          </>
        )}

        {editingBio ? (
          <div className="mb-3">
            <textarea
              value={bioInput}
              autoFocus
              rows={3}
              maxLength={150}
              onChange={(e) => setBioInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#FFFFFF', border: '1px solid #F3B4E3', color: '#1C1C1E' }}
            />
            <div className="flex gap-2 mt-1.5">
              <button onClick={saveBio} className="px-4 py-2.5 rounded-lg text-xs font-bold" style={{ background: '#F3B4E3', color: '#FFFFFF' }}>{t('Common.save')}</button>
              <button onClick={() => setEditingBio(false)} className="px-4 py-2.5 rounded-lg text-xs font-semibold" style={{ background: '#F0F0F5', color: '#636366' }}>{t('Common.cancel')}</button>
            </div>
          </div>
        ) : (
          <button className="text-left w-full mb-3" onClick={startEditBio}>
            <p className="text-sm leading-relaxed" style={{ color: profile.bio ? '#1C1C1E' : '#9A9A9F' }}>
              {profile.bio || t('Profile.profileBio')}
            </p>
          </button>
        )}
      </div>

      {/* --- Member rank + Stats (統合カード) --- */}
      <div className="px-4 mb-3">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }}>
          {/* Rank header */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ background: rank.bg, color: rank.color, border: `1.5px solid ${rank.color}30` }}
              >
                {rank.initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black leading-tight" style={{ color: rank.color }}>{rank.label}</p>
                {nextRank ? (
                  <p className="text-[10px] leading-tight" style={{ color: '#8E8E93' }}>
                    {t('Common.nextRank')} {nextRank.min - score} pt
                  </p>
                ) : (
                  <p className="text-[10px] leading-tight" style={{ color: '#8E8E93' }}>{t('Common.maxRank')}</p>
                )}
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: '#C7C7CC' }}>{score} pt</span>
            </div>
            {nextRank && (
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0F0F5' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((score - rank.min) / (nextRank.min - rank.min)) * 100)}%`,
                    background: rank.color,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            )}
            <div className="flex justify-between mt-2">
              {RANKS.map((r) => (
                <div key={r.key} className="flex flex-col items-center gap-0.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{
                      background: r.key === rank.key ? r.bg : '#F0F0F5',
                      color: r.key === rank.key ? r.color : '#C7C7CC',
                      border: r.key === rank.key ? `1.5px solid ${r.color}40` : '1.5px solid transparent',
                    }}
                  >
                    {r.initial}
                  </div>
                  <span
                    className="text-[8px] font-bold"
                    style={{ color: r.key === rank.key ? r.color : '#C7C7CC' }}
                  >
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats 4列 (divider) */}
          <div className="grid grid-cols-4" style={{ borderTop: '1px solid #F0F0F5' }}>
            {[
              { label: t('Common.statPosts'), value: stats.posts },
              { label: t('Common.statApprovals'), value: stats.approvals },
              { label: t('Common.statEdits'), value: stats.edits },
              { label: t('Common.statReferrals'), value: stats.referrals },
            ].map((s, i) => (
              <div
                key={s.label}
                className="flex flex-col items-center py-2"
                style={i > 0 ? { borderLeft: '1px solid #F0F0F5' } : undefined}
              >
                <span className="text-lg font-black leading-tight" style={{ color: '#F3B4E3' }}>{s.value}</span>
                <span className="text-[10px]" style={{ color: '#8E8E93' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Favorite Artist + Oshi Members (統合) --- */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold" style={{ color: '#8E8E93' }}>{t('Common.favArtist')}</p>
          <button
            onClick={() => setEditingOshi(v => !v)}
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}
          >
            {editingOshi ? '完了' : '推し変更'}
          </button>
        </div>

        <div className="p-4 rounded-2xl" style={{ background: '#FFFFFF' }}>
          {/* SEVENTEEN + 推しメンバーチップ を1ブロックに集約 */}
          <div className="flex items-start gap-3 flex-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/seventeen.png" alt="SEVENTEEN" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold leading-tight" style={{ color: '#1C1C1E' }}>SEVENTEEN</p>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#3B82F6">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                </svg>
              </div>
              {!editingOshi && (
                <>
                  {favMemberIds.length === 0 ? (
                    <p className="text-[11px]" style={{ color: '#8E8E93' }}>推しメンバー未設定（「推し変更」から選択）</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {seventeenMembers.map((m, i) => {
                        const memberId = `A${String(i + 1).padStart(6, '0')}`
                        if (!favMemberIds.includes(memberId)) return null
                        return (
                          <div
                            key={memberId}
                            className="flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full"
                            style={{ background: `${m.color}1A`, border: `1.5px solid ${m.color}` }}
                          >
                            <div
                              className="w-5 h-5 rounded-full flex-shrink-0"
                              style={{
                                background: m.photo ? `url(${m.photo}) center/cover` : m.color,
                              }}
                            />
                            <span className="text-[11px] font-bold" style={{ color: m.color }}>{m.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {editingOshi && (
          // Edit view: full 13-member grid
          <div className="mt-3">
            <p className="text-[10px] mb-1" style={{ color: '#8E8E93' }}>推しメンバー（複数選択できます）</p>
            <p className="text-[10px] mb-2" style={{ color: '#8E8E93' }}>タップした順に 1番推し, 2番推し…として登録されます</p>
            <div className="flex flex-wrap gap-2">
              {seventeenMembers.map((m, i) => {
                const memberId = `A${String(i + 1).padStart(6, '0')}`
                const favIndex = favMemberIds.indexOf(memberId)
                const selected = favIndex >= 0
                const rank = selected ? favIndex + 1 : 0
                return (
                  <button
                    key={memberId}
                    onClick={() => toggleFavMember(memberId)}
                    className="relative rounded-xl overflow-hidden transition-all"
                    style={{
                      width: 64,
                      height: 64,
                      background: m.photo ? `url(${m.photo}) center/cover` : m.color,
                      border: selected ? `3px solid ${m.color}` : '3px solid transparent',
                      opacity: selected ? 1 : 0.85,
                    }}
                  >
                    {selected && (
                      <div
                        className="absolute top-0.5 right-0.5 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-black"
                        style={{ background: m.color, border: '2px solid #FFFFFF', color: '#FFFFFF' }}
                      >
                        {rank}
                      </div>
                    )}
                    <div
                      className="absolute bottom-0 left-0 right-0 text-center py-1"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))' }}
                    >
                      <span className="text-[9px] font-bold" style={{ color: '#FFFFFF' }}>
                        {m.name}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* --- Referral code (admin / fam のみ) --- */}
      {(profile.role === 'admin' || profile.role === 'fam') && <ReferralSection />}

      {/* 参戦記録 詳細モーダル */}
      {showConcerts && portalMounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: '#F8F9FA', zIndex: 99999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #E5E5EA', paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🎤</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>参戦記録</p>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}>
                {liveEntries.length}件
              </span>
            </div>
            <button onClick={() => setShowConcerts(false)} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <p style={{ fontSize: 10, color: '#8E8E93', margin: 0, marginBottom: 8 }}>← 左にスワイプで削除</p>
            {liveEntries
              .slice()
              .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
              .map((e) => (
                <SwipeableConcertRow
                  key={e.id}
                  entry={e}
                  onOpen={() => {
                    setShowConcerts(false)
                    router.push(`/my?entry=${e.id}`)
                  }}
                  onDelete={() => removeEntry(e.id)}
                />
              ))}
          </div>
        </div>,
        document.body
      )}

      {/* --- Fan club + 参戦記録 (FC 空 & 参戦記録ありの時は 2 列並列) --- */}
      {profile.fanClubs.length === 0 && liveEntries.length > 0 ? (
        <div className="px-4 mb-3">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={openNewFc}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl"
              style={{ background: '#FFFFFF', border: '1.5px dashed #E5E5EA', minHeight: 76 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span className="text-[11px] font-bold" style={{ color: '#F3B4E3' }}>{t('Common.fanClubAdd')}</span>
            </button>
            <button
              onClick={() => setShowConcerts(true)}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl"
              style={{ background: '#FFFFFF', minHeight: 76 }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">🎤</span>
                <span className="text-xs font-bold" style={{ color: '#1C1C1E' }}>参戦記録</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}>
                {liveEntries.length}件
              </span>
            </button>
          </div>
        </div>
      ) : (
      <>
      {/* --- Fan club membership --- */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold" style={{ color: '#8E8E93' }}>{t('Common.fanClub')}</p>
          <button
            onClick={openNewFc}
            className="flex items-center gap-1 px-3 py-2.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(243,180,227,0.1)', color: '#F3B4E3' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('Common.add')}
          </button>
        </div>

        {profile.fanClubs.length === 0 ? (
          <button
            onClick={openNewFc}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl"
            style={{ border: '1.5px dashed #C7C7CC', color: '#8E8E93' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span className="text-xs">{t('Common.fanClubAdd')}</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            {profile.fanClubs.map((fc) => (
              <button
                key={fc.id}
                onClick={() => openEditFc(fc)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                style={{ background: '#FFFFFF' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/seventeen.png" alt="SEVENTEEN" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{fc.clubName}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs font-mono" style={{ color: '#F3B4E3' }}>{fc.memberNumber}</span>
                    {fc.validUntil && <span className="text-[10px]" style={{ color: '#8E8E93' }}>{'\u301C'}{fc.validUntil}</span>}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- 参戦記録 (LIVE entries) — ボタンのみ、一覧は詳細モーダル --- */}
      {liveEntries.length > 0 && (
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowConcerts(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: '#FFFFFF' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🎤</span>
              <span className="text-sm font-bold" style={{ color: '#1C1C1E' }}>参戦記録</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}>
                {liveEntries.length}件
              </span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
      </>
      )}

      <div style={{ height: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} />

      {/* --- Image crop modal --- */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspectRatio={cropTarget === 'banner' ? 2 : 1}
          circle={cropTarget === 'avatar'}
          onConfirm={onCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}


      {/* --- Settings modal --- */}
      {showSettings && portalMounted && createPortal(
        <div className="fixed inset-0 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 60 }}
          onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-lg rounded-t-2xl flex flex-col"
            style={{ background: '#FFFFFF', maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex-shrink-0 px-5 pt-4 pb-3 sticky top-0 z-10" style={{ background: '#FFFFFF' }}>
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-base font-bold" style={{ color: '#1C1C1E' }}>{t('ProfilePage.settings')}</p>
                <button onClick={() => setShowSettings(false)} className="w-10 h-10 flex items-center justify-center -mr-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
              <div className="rounded-xl overflow-hidden mx-4" style={{ background: '#F8F9FA' }}>

                {/* Notifications */}
                <button
                  onClick={() => setNotifExpanded((v) => !v)}
                  className="w-full flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="text-base w-6 text-center">{'\uD83D\uDD14'}</span>
                  <span className="flex-1 text-sm font-medium text-left" style={{ color: '#1C1C1E' }}>{t('Profile.notifSettings')}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2"
                    style={{ transform: notifExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {notifExpanded && (
                  <div style={{ borderTop: '1px solid #F0F0F5', background: '#FAFAFA' }}>
                    <div className="px-5 py-3">
                      <button
                        onClick={async () => {
                          try {
                            let result: string
                            try {
                              result = await new Promise<string>((resolve) => {
                                const p = Notification.requestPermission((r: string) => resolve(r))
                                if (p && typeof p.then === 'function') p.then(resolve)
                              })
                            } catch {
                              result = Notification.permission
                            }
                            if (result === 'granted') {
                              const { initOneSignal, loginOneSignal } = await import('@/lib/onesignal/client')
                              await initOneSignal()
                              const { createClient } = await import('@/lib/supabase/client')
                              const sb = createClient()
                              const { data: { user: u } } = await sb.auth.getUser()
                              if (u) await loginOneSignal(u.id)
                            }
                          } catch { /* ignore */ }
                        }}
                        className="w-full py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg, #F3B4E3, #C97AB8)', color: '#FFFFFF' }}>
                        {t('ProfilePage.allowNotifications')}
                      </button>
                    </div>
                    <div className="px-5 py-3 flex items-center gap-3">
                      <span className="text-sm flex-1" style={{ color: '#1C1C1E' }}>{t('Profile.notifMorning')}</span>
                      <Toggle on={profile.notif.morningOn} onChange={(v) => updateNotif({ morningOn: v })} />
                    </div>
                    {profile.notif.morningOn && (
                      <div className="px-5 pb-3 flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#8E8E93' }}>{t('Profile.notifTime')}</span>
                        <select value={profile.notif.morningTime}
                          onChange={(e) => updateNotif({ morningTime: e.target.value })}
                          className="px-3 py-1.5 rounded-lg text-sm outline-none"
                          style={{ background: '#F0F0F5', border: '1px solid #E5E5EA', color: '#1C1C1E' }}>
                          {Array.from({ length: 48 }, (_, i) => {
                            const h = String(Math.floor(i / 2)).padStart(2, '0')
                            const m = i % 2 === 0 ? '00' : '30'
                            return <option key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</option>
                          })}
                        </select>
                      </div>
                    )}
                    <div className="px-5 py-3 flex items-center gap-3" style={{ borderTop: '1px solid #F0F0F5' }}>
                      <span className="text-sm flex-1" style={{ color: '#1C1C1E' }}>{t('Profile.notifEvening')}</span>
                      <Toggle on={profile.notif.eveningOn} onChange={(v) => updateNotif({ eveningOn: v })} />
                    </div>
                    {profile.notif.eveningOn && (
                      <div className="px-5 pb-3 flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#8E8E93' }}>{t('Profile.notifTime')}</span>
                        <select value={profile.notif.eveningTime}
                          onChange={(e) => updateNotif({ eveningTime: e.target.value })}
                          className="px-3 py-1.5 rounded-lg text-sm outline-none"
                          style={{ background: '#F0F0F5', border: '1px solid #E5E5EA', color: '#1C1C1E' }}>
                          {Array.from({ length: 48 }, (_, i) => {
                            const h = String(Math.floor(i / 2)).padStart(2, '0')
                            const m = i % 2 === 0 ? '00' : '30'
                            return <option key={`${h}:${m}`} value={`${h}:${m}`}>{`${h}:${m}`}</option>
                          })}
                        </select>
                      </div>
                    )}
                    <div className="px-5 py-3 flex items-center gap-3" style={{ borderTop: '1px solid #F0F0F5' }}>
                      <span className="text-sm flex-1" style={{ color: '#1C1C1E' }}>{t('Profile.notifReminder')}</span>
                      <Toggle on={profile.notif.myEventReminder} onChange={(v) => updateNotif({ myEventReminder: v })} />
                    </div>
                  </div>
                )}

                {/* LINE (テスト中: admin のみ表示) */}
                {profile.role === 'admin' && (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: '1px solid #F0F0F5' }}>
                      <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0"
                        style={{ background: '#06C755', color: '#FFFFFF' }}>L</div>
                      <span className="flex-1 text-sm font-medium" style={{ color: '#1C1C1E' }}>{t('Profile.linkLine')}</span>
                      {profile.lineLinked ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                          style={{ background: '#06C75520', color: '#06C755' }}>
                          {t('Profile.linked')}
                        </span>
                      ) : (
                        <a href="https://line.me/R/ti/p/@529grkxp" target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-full text-xs font-bold"
                          style={{ background: '#06C755', color: '#FFFFFF' }}>
                          {t('ProfilePage.addFriend')}
                        </a>
                      )}
                    </div>
                    {!profile.lineLinked && (
                      <p className="px-5 pb-2 text-[10px]" style={{ color: '#8E8E93' }}>
                        {t('ProfilePage.addFriendHint')}
                      </p>
                    )}
                  </>
                )}

                {/* X */}
                <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: '1px solid #F0F0F5' }}>
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: '#000000' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="flex-1 text-sm font-medium" style={{ color: '#1C1C1E' }}>{t('Profile.linkX')}</span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: '#F0F0F5', color: '#8E8E93' }}>
                    {t('ProfilePage.preparing')}
                  </span>
                </div>

                {/* Language */}
                <button
                  onClick={() => { setShowSettings(false); setTimeout(() => setShowLangPicker(true), 200) }}
                  className="w-full flex items-center gap-3 px-4 py-3.5"
                  style={{ borderTop: '1px solid #F0F0F5' }}
                >
                  <span className="text-base w-6 text-center">{'\uD83C\uDF10'}</span>
                  <span className="flex-1 text-sm font-medium text-left" style={{ color: '#1C1C1E' }}>{t('Common.language')}</span>
                  <span className="text-xs mr-1" style={{ color: '#8E8E93' }}>
                    {LANGUAGES.find((l) => l.code === profile.language)?.flag}{' '}
                    {LANGUAGES.find((l) => l.code === profile.language)?.label}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Country */}
                <button
                  onClick={() => { setShowSettings(false); setTimeout(() => setShowCountryPicker(true), 200) }}
                  className="w-full flex items-center gap-3 px-4 py-3.5"
                  style={{ borderTop: '1px solid #F0F0F5' }}
                >
                  <span className="text-base w-6 text-center">
                    {countryFlag(profile.country)}
                  </span>
                  <span className="flex-1 text-sm font-medium text-left" style={{ color: '#1C1C1E' }}>{t('Common.country')}</span>
                  <span className="text-xs mr-1" style={{ color: '#8E8E93' }}>
                    {COUNTRIES.find((c) => c.code === profile.country)?.nameJa ?? profile.country}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              <div className="mx-4 my-4" style={{ height: 1, background: '#E5E5EA' }} />

              {/* fam / admin 限定メニュー */}
              {(profile.role === 'fam' || profile.role === 'admin') && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => { setShowSettings(false); router.push('/submit-notice') }}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ background: 'rgba(243,180,227,0.12)', color: '#C06BA8' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    {t('SubmitNotice.title')}
                  </button>
                </div>
              )}

              {/* Feedback, sign out, delete */}
              <div className="px-4 flex flex-col gap-3">
                <button
                  onClick={() => { setShowSettings(false); setFeedbackMsg(''); setFeedbackState('idle'); setShowFeedback(true) }}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: '#F8F9FA', color: '#636366' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  {t('Profile.feedbackHere')}
                </button>

                {showSignOutConfirm ? (
                  <div className="flex gap-3">
                    <button onClick={() => setShowSignOutConfirm(false)}
                      className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                      style={{ background: '#F8F9FA', color: '#636366' }}>
                      {t('Common.cancel')}
                    </button>
                    <button onClick={handleSignOut}
                      className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                      {t('Profile.signOutConfirm')}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowSignOutConfirm(true)}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold"
                    style={{ background: '#F8F9FA', color: '#EF4444' }}>
                    {t('Profile.signOut')}
                  </button>
                )}

                <button
                  onClick={() => { setDeleteAgreed(false); setShowDeleteConfirm(true) }}
                  className="w-full py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'transparent', color: '#C7C7CC' }}
                >
                  {t('Profile.deleteAccount')}
                </button>

                <p className="text-center text-xs" style={{ color: '#C7C7CC' }}>Connects+ v1.0.0</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- Language picker --- */}
      {showLangPicker && portalMounted && createPortal(
        <div className="fixed inset-0 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 60 }}
          onClick={() => setShowLangPicker(false)}>
          <div className="w-full max-w-lg rounded-t-2xl flex flex-col"
            style={{ background: '#FFFFFF', maxHeight: '75vh' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex-shrink-0 px-5 pt-4 pb-3">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
              </div>
              <p className="text-base font-bold" style={{ color: '#1C1C1E' }}>{t('Profile.selectLanguage')}</p>
            </div>
            <div className="overflow-y-auto px-5" style={{ minHeight: 0, paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
              <div className="flex flex-col gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { update({ language: l.code }); document.cookie = `NEXT_LOCALE=${l.code};path=/;max-age=31536000`; setShowLangPicker(false); router.replace('/profile', { locale: l.code as 'ja' | 'en' | 'ko' }) }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                    style={{
                      background: profile.language === l.code ? 'rgba(243,180,227,0.1)' : '#F8F9FA',
                      border: `1.5px solid ${profile.language === l.code ? '#F3B4E3' : '#F0F0F5'}`,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{l.flag}</span>
                    <span className="text-sm font-semibold" style={{ color: '#1C1C1E' }}>{l.label}</span>
                    {profile.language === l.code && (
                      <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- Country picker --- */}
      {showCountryPicker && portalMounted && createPortal(
        <div className="fixed inset-0 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 60 }}
          onClick={() => setShowCountryPicker(false)}>
          <div className="w-full max-w-lg rounded-t-2xl flex flex-col"
            style={{ background: '#FFFFFF', maxHeight: '75vh' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex-shrink-0 px-5 pt-4 pb-3">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
              </div>
              <p className="text-base font-bold" style={{ color: '#1C1C1E' }}>{t('Profile.selectCountry')}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-28" style={{ minHeight: 0 }}>
              <div className="grid grid-cols-2 gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { update({ country: c.code }); setShowCountryPicker(false) }}
                    className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-left"
                    style={{
                      background: profile.country === c.code ? 'rgba(243,180,227,0.1)' : '#F8F9FA',
                      border: `1.5px solid ${profile.country === c.code ? '#F3B4E3' : '#F0F0F5'}`,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{countryFlag(c.code)}</span>
                    <span className="text-sm font-semibold truncate"
                      style={{ color: profile.country === c.code ? '#F3B4E3' : '#1C1C1E' }}>
                      {c.nameJa}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- Delete account confirm modal --- */}
      {showDeleteConfirm && portalMounted && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold mb-2 text-center" style={{ color: '#1C1C1E' }}>{t('Profile.deleteAccountConfirmTitle')}</p>
            <p className="text-sm mb-5 text-center leading-relaxed" style={{ color: '#636366' }}>
              {t('Profile.deleteAccountConfirmMsg')}
            </p>
            <label className="flex items-start gap-3 mb-5 cursor-pointer">
              <div
                onClick={() => setDeleteAgreed((v) => !v)}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: deleteAgreed ? '#EF4444' : '#FFFFFF',
                  border: `1.5px solid ${deleteAgreed ? '#EF4444' : '#C7C7CC'}`,
                }}
              >
                {deleteAgreed && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-sm leading-relaxed" style={{ color: '#1C1C1E' }}>
                {t('Profile.deleteAccountAgree')}
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#F0F0F5', color: '#636366' }}
              >{t('Common.cancel')}</button>
              <button
                onClick={handleDeleteAccount}
                disabled={!deleteAgreed}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{
                  background: deleteAgreed ? '#EF4444' : '#F0F0F5',
                  color: deleteAgreed ? '#FFFFFF' : '#C7C7CC',
                }}
              >{t('Profile.deleteAccountButton')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- Feedback modal --- */}
      {showFeedback && portalMounted && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
          onClick={() => setShowFeedback(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-5 overflow-y-auto"
            style={{ background: '#FFFFFF', maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
            </div>
            <p className="text-base font-bold mb-1" style={{ color: '#1C1C1E' }}>{t('Profile.feedbackTitle')}</p>
            <p className="text-xs mb-4" style={{ color: '#8E8E93' }}>{t('Profile.feedbackDesc')}</p>

            {feedbackState === 'done' ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#E8F8F0' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06C755" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{t('Profile.feedbackSent')}</p>
                <p className="text-xs" style={{ color: '#8E8E93' }}>{t('Profile.feedbackThanks')}</p>
                <button onClick={() => setShowFeedback(false)} className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#F3B4E3', color: '#FFFFFF' }}>
                  {t('Common.close')}
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  placeholder={t('Profile.feedbackPlaceholder')}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: '#F8F9FA', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
                  onFocus={() => {
                    setTimeout(() => {
                      document.querySelector('[data-feedback-submit]')?.scrollIntoView({ behavior: 'smooth', block: 'end' })
                    }, 300)
                  }}
                />
                <div className="flex items-center justify-between mt-1 mb-2">
                  <p className="text-[10px]" style={{ color: '#C7C7CC' }}>{feedbackMsg.length}/500</p>
                  {feedbackState === 'error' && (
                    <p className="text-[10px]" style={{ color: '#EF4444' }}>{t('Profile.feedbackError')}</p>
                  )}
                </div>
                <button
                  data-feedback-submit
                  onClick={sendFeedback}
                  disabled={!feedbackMsg.trim() || feedbackState === 'sending'}
                  className="w-full py-3.5 rounded-xl text-sm font-bold"
                  style={{
                    background: feedbackMsg.trim() ? '#F3B4E3' : '#F0F0F5',
                    color: feedbackMsg.trim() ? '#FFFFFF' : '#8E8E93',
                  }}
                >
                  {feedbackState === 'sending' ? t('Common.sending') : t('Common.send')}
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* --- FC modal --- */}
      {fcModal !== null && portalMounted && createPortal(
        <div
          className="fixed inset-0 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
          onClick={() => setFcModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl"
            style={{ background: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ color: '#1C1C1E' }}>
                  {fcModal === 'new' ? t('Profile.fcAddTitle') : t('Profile.fcEditTitle')}
                </h2>
                <button onClick={() => setFcModal(null)} className="w-10 h-10 flex items-center justify-center -mr-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              className="px-5"
              style={{
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                maxHeight: 'calc(70vh - 210px)',
              }}
            >
              <div className="flex flex-col gap-3 pb-3">
                <FcField label={t('Profile.fcArtistName')} value={fcForm.clubName ?? ''} placeholder="例: SEVENTEEN"
                  onChange={(v) => setFcForm((f) => ({ ...f, clubName: v }))} />
                <FcField label={t('Profile.fcEmail')} value={fcForm.email ?? ''} placeholder="example@email.com"
                  onChange={(v) => setFcForm((f) => ({ ...f, email: v }))} inputType="email" />
                <FcField label={t('Profile.fcMemberNumber')} value={fcForm.memberNumber ?? ''} placeholder="例: 00123456"
                  onChange={(v) => setFcForm((f) => ({ ...f, memberNumber: v }))} />
                <FcField label={t('Profile.fcMemberPassword')} value={fcForm.memberPassword ?? ''} placeholder={t('Common.password')}
                  onChange={(v) => setFcForm((f) => ({ ...f, memberPassword: v }))} inputType="password" />
                <FcField label={t('Profile.fcMobileMemberNumber')} value={fcForm.mobileMemberNumber ?? ''} placeholder="例: M00123456"
                  onChange={(v) => setFcForm((f) => ({ ...f, mobileMemberNumber: v }))} />
                <FcField label={t('Profile.fcMobilePassword')} value={fcForm.mobilePassword ?? ''} placeholder={t('Common.password')}
                  onChange={(v) => setFcForm((f) => ({ ...f, mobilePassword: v }))} inputType="password" />
                <FcField label={t('Profile.fcPhone')} value={fcForm.phone ?? ''} placeholder="090-0000-0000"
                  onChange={(v) => setFcForm((f) => ({ ...f, phone: v }))} inputType="tel" />
                <FcField label={t('Profile.fcValidUntil')} value={fcForm.validUntil ?? ''} placeholder="YYYY-MM-DD"
                  onChange={(v) => setFcForm((f) => ({ ...f, validUntil: v }))} inputType="date" />
                <FcField label={t('Profile.fcNote')} value={fcForm.note ?? ''} placeholder={t('Profile.fcNotePlaceholder')}
                  onChange={(v) => setFcForm((f) => ({ ...f, note: v }))} />
              </div>
            </div>

            <div className="px-5 pt-4 flex-shrink-0" style={{ borderTop: '1px solid #F0F0F5', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
              <div className="flex gap-2">
                {fcModal !== 'new' && (
                  <button
                    onClick={() => { removeFanClub(fcModal); setFcModal(null) }}
                    className="px-4 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: '#FEE2E2', color: '#EF4444' }}
                  >{t('Common.delete')}</button>
                )}
                <button
                  onClick={saveFc}
                  disabled={!fcForm.clubName || !fcForm.memberNumber}
                  className="flex-1 py-3 rounded-xl text-sm font-bold"
                  style={{
                    background: fcForm.clubName && fcForm.memberNumber ? '#F3B4E3' : '#F0F0F5',
                    color: fcForm.clubName && fcForm.memberNumber ? '#FFFFFF' : '#8E8E93',
                  }}
                >{t('Common.save')}</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}


function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="w-11 h-6 rounded-full flex items-center px-0.5 flex-shrink-0"
      style={{ background: on ? '#F3B4E3' : '#C7C7CC' }}
    >
      <div className="w-5 h-5 rounded-full" style={{
        background: '#FFFFFF',
        transform: on ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 0.2s',
      }} />
    </button>
  )
}

function FcField({ label, value, placeholder, onChange, inputType = 'text' }: {
  label: string; value: string; placeholder: string; onChange: (v: string) => void; inputType?: string
}) {
  return (
    <div>
      <label className="text-xs font-bold block mb-1" style={{ color: '#8E8E93' }}>{label}</label>
      <input
        type={inputType}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: '#F8F9FA', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
      />
    </div>
  )
}

// ── Referral section (my code display + copy + input for inviter) ──
function ReferralSection() {
  const { myCode, introducedBy, loading, setIntroducer } = useReferral()
  const [copied, setCopied] = useState(false)
  const [inputCode, setInputCode] = useState('')
  const [submitState, setSubmitState] = useState<{ status: 'idle' | 'saving' | 'ok' | 'err'; msg?: string }>({ status: 'idle' })

  const APP_URL = 'https://app.connectsplus.net'

  const handleCopy = async () => {
    if (!myCode) return
    const text = `${APP_URL}\n紹介コード : ${myCode}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* noop */ }
  }

  const handleSubmit = async () => {
    setSubmitState({ status: 'saving' })
    const res = await setIntroducer(inputCode)
    if (res.ok) {
      setSubmitState({ status: 'ok' })
      setInputCode('')
    } else {
      setSubmitState({ status: 'err', msg: res.error })
    }
  }

  if (loading) return null

  return (
    <div className="px-4 mb-4">
      <p className="text-xs font-semibold mb-2" style={{ color: '#8E8E93' }}>紹介コード</p>
      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
        {/* 自分のコード */}
        <div className="mb-3">
          <p className="text-[10px] font-bold mb-1" style={{ color: '#8E8E93' }}>あなたの紹介コード</p>
          {myCode ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl text-sm font-bold" style={{ background: 'rgba(243,180,227,0.12)', color: '#F3B4E3' }}>
                {myCode}
              </code>
              <button
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: copied ? '#22C55E' : '#1C1C1E', color: '#FFFFFF', minWidth: 90 }}
              >
                {copied ? 'コピーしました' : 'コピー'}
              </button>
            </div>
          ) : (
            <p className="text-xs" style={{ color: '#8E8E93' }}>移行完了後に発行されます</p>
          )}
          {myCode && (
            <>
              <div className="mt-2 px-3 py-2 rounded-xl" style={{ background: '#F8F9FA' }}>
                <p className="text-[9px] font-bold mb-0.5" style={{ color: '#8E8E93' }}>登録URL</p>
                <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold break-all" style={{ color: '#60A5FA' }}>
                  {APP_URL}
                </a>
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: '#8E8E93' }}>
                コピーボタンで URL + 紹介コードをまとめて共有できます
              </p>
            </>
          )}
        </div>

        {/* 紹介者入力 — 未設定時のみ表示、登録後は非表示 */}
        {!introducedBy && (
        <div className="pt-3" style={{ borderTop: '1px solid #F0F0F5' }}>
          <p className="text-[10px] font-bold mb-1" style={{ color: '#8E8E93' }}>紹介してくれた人のコード</p>
          <>
              <div className="flex items-center gap-2">
                <input
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  placeholder="UXXXXXX-XXXX"
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: '#F8F9FA', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
                  disabled={submitState.status === 'saving'}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!inputCode.trim() || submitState.status === 'saving'}
                  className="px-4 py-2 rounded-xl text-xs font-bold"
                  style={{
                    background: inputCode.trim() ? '#F3B4E3' : '#E5E5EA',
                    color: inputCode.trim() ? '#FFFFFF' : '#8E8E93',
                    minWidth: 70,
                  }}
                >
                  {submitState.status === 'saving' ? '...' : '登録'}
                </button>
              </div>
              {submitState.status === 'err' && (
                <p className="text-[10px] mt-1.5" style={{ color: '#EF4444' }}>{submitState.msg}</p>
              )}
              {submitState.status === 'ok' && (
                <p className="text-[10px] mt-1.5" style={{ color: '#22C55E' }}>登録しました ✓</p>
              )}
              <p className="text-[10px] mt-1.5" style={{ color: '#8E8E93' }}>
                紹介してくれた人がいる場合のみ入力してください (一度だけ設定可能)
              </p>
            </>
        </div>
        )}
      </div>
    </div>
  )
}
