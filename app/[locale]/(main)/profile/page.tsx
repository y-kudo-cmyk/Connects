'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/useAuth'
import { useTranslations } from 'next-intl'
import { useProfile, FanClubMembership, NotifSettings } from '@/lib/useProfile'
import { compressImage } from '@/lib/useMyEntries'
import { useReferral } from '@/lib/useReferral'
import { COUNTRIES, countryFlag } from '@/lib/countryUtils'
import ImageCropModal from '@/components/ImageCropModal'

const LANGUAGES = [
  { code: 'ja' as const, flag: '🇯🇵', label: '日本語' },
  { code: 'en' as const, flag: '🇺🇸', label: 'English' },
  { code: 'ko' as const, flag: '🇰🇷', label: '한국어' },
]

const USER_ID = 'CARAT#28596'

const RANKS = [
  { key: 'none',     label: 'None',     color: '#8E8E93', bg: '#F0F0F5',   initial: '○', min: 0,   next: 1   },
  { key: 'bronze',   label: 'Bronze',   color: '#CD7F32', bg: '#F5E6D3',   initial: 'B',  min: 1,   next: 10  },
  { key: 'silver',   label: 'Silver',   color: '#7D7D7D', bg: '#EBEBEB',   initial: 'S',  min: 10,  next: 30  },
  { key: 'gold',     label: 'Gold',     color: '#B8921A', bg: '#FBF0CC',   initial: 'G',  min: 30,  next: 75  },
  { key: 'platinum', label: 'Platinum', color: '#6B5EA8', bg: '#EAE6F8',   initial: 'P',  min: 75,  next: 150 },
  { key: 'diamond',  label: 'Diamond',  color: '#0EA5C9', bg: '#DCEFFE',   initial: 'D',  min: 150, next: null},
] as const

function calcScore(s: { posts: number; approvals: number; edits: number; referrals: number }) {
  return s.posts + s.approvals + s.edits + s.referrals * 2
}

function getRank(score: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].min) return RANKS[i]
  }
  return RANKS[0]
}

async function loadImage(files: FileList | null, maxPx: number): Promise<string | null> {
  if (!files?.[0]) return null
  return compressImage(files[0], maxPx, 0.82)
}

export default function ProfilePage() {
  const { profile, update, addFanClub, updateFanClub, removeFanClub } = useProfile()
  const { signOut } = useAuth()
  const t = useTranslations()

  const bannerRef = useRef<HTMLInputElement>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput, setBioInput] = useState('')

  const { myCode } = useReferral()
  const [copied, setCopied] = useState(false)
  const [fcModal, setFcModal] = useState<'new' | string | null>(null)
  const [fcForm, setFcForm] = useState<Partial<FanClubMembership>>({})
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteAgreed, setDeleteAgreed] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [feedbackState, setFeedbackState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropTarget, setCropTarget] = useState<'banner' | 'avatar'>('banner')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [notifExpanded, setNotifExpanded] = useState(false)
  const router = useRouter()

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
    const url = await loadImage(e.target.files, 1600)
    if (url) { setCropTarget('banner'); setCropSrc(url) }
    e.target.value = ''
  }

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await loadImage(e.target.files, 800)
    if (url) { setCropTarget('avatar'); setCropSrc(url) }
    e.target.value = ''
  }

  const onCropConfirm = (dataUrl: string) => {
    if (cropTarget === 'banner') update({ bannerImage: dataUrl })
    else update({ avatarImage: dataUrl })
    setCropSrc(null)
  }

  const startEditNickname = () => { setNicknameInput(profile.nickname); setEditingNickname(true) }
  const saveNickname = () => { if (nicknameInput.trim()) update({ nickname: nicknameInput.trim() }); setEditingNickname(false) }

  const startEditBio = () => { setBioInput(profile.bio); setEditingBio(true) }
  const saveBio = () => { update({ bio: bioInput }); setEditingBio(false) }

  const openNewFc = () => { setFcForm({}); setFcModal('new') }
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
    <div className="flex flex-col min-h-full" style={{ background: '#F8F9FA' }}>

      {/* ─── 固定ヘッダー ─── */}
      <div
        className="sticky top-0 z-10 flex items-center justify-center"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #F0F0F5',
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          paddingBottom: 12,
        }}
      >
        <span className="text-sm font-black tracking-wider" style={{ color: '#1C1C1E' }}>PROFILE</span>
      </div>

      {/* ─── バナー＋アバター ─── */}
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

      {/* ─── ユーザー情報 ─── */}
      <div className="px-4 pb-3">
        {editingNickname ? (
          <div className="flex items-center gap-2 mb-1">
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
        ) : (
          <button className="flex items-center gap-1.5 mb-1" onClick={startEditNickname}>
            <span className="text-lg font-bold" style={{ color: '#1C1C1E' }}>{profile.nickname}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-1.5 mb-3">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <span className="text-xs font-mono font-semibold" style={{ color: '#636366' }}>{USER_ID}</span>
        </div>

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

      {/* ─── 統計（フラット） ─── */}
      <div className="mx-4 mb-4">
        <div className="grid grid-cols-4 rounded-2xl overflow-hidden" style={{ background: '#EFEFEF' }}>
          {[
            { label: t('Common.statPosts'), value: stats.posts },
            { label: t('Common.statApprovals'), value: stats.approvals },
            { label: t('Common.statEdits'), value: stats.edits },
            { label: t('Common.statReferrals'), value: stats.referrals },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-3">
              <span className="text-xl font-black" style={{ color: '#F3B4E3' }}>{s.value}</span>
              <span className="text-[10px]" style={{ color: '#8E8E93' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 会員ランク ─── */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold mb-2" style={{ color: '#8E8E93' }}>{t('Common.memberRank')}</p>
        <div className="px-4 py-3 rounded-xl" style={{ background: '#FFFFFF' }}>
          {/* ランク名とアイコン */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black flex-shrink-0"
              style={{ background: rank.bg, color: rank.color, border: `1.5px solid ${rank.color}30` }}
            >
              {rank.initial}
            </div>
            <div className="flex-1">
              <p className="text-base font-black" style={{ color: rank.color }}>{rank.label}</p>
              {nextRank ? (
                <p className="text-[10px]" style={{ color: '#8E8E93' }}>
                  {t('Common.nextRank')} {nextRank.min - score} pt
                </p>
              ) : (
                <p className="text-[10px]" style={{ color: '#8E8E93' }}>{t('Common.maxRank')}</p>
              )}
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: '#C7C7CC' }}>{score} pt</span>
          </div>
          {/* プログレスバー */}
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
          {/* 全ランク一覧 */}
          <div className="flex justify-between mt-3">
            {RANKS.map((r) => (
              <div key={r.key} className="flex flex-col items-center gap-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
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
      </div>

      {/* ─── 推しアーティスト ─── */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold mb-2" style={{ color: '#8E8E93' }}>{t('Common.favArtist')}</p>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#FFFFFF' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seventeen.png" alt="SEVENTEEN" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>SEVENTEEN</p>
            <p className="text-xs" style={{ color: '#8E8E93' }}>13 members</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#3B82F6">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
      </div>

      {/* ─── 紹介コード ─── */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold mb-2" style={{ color: '#8E8E93' }}>{t('Common.yourRefCode')}</p>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-black font-mono tracking-widest" style={{ color: '#F3B4E3' }}>
              {myCode}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(myCode).then(() => {
                  setCopied(true); setTimeout(() => setCopied(false), 2000)
                })
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: copied ? '#06C75520' : '#F3B4E320', color: copied ? '#06C755' : '#F3B4E3' }}
            >
              {copied ? t('Common.copied') : t('Common.copy')}
            </button>
          </div>
          <button
            onClick={() => {
              const url = `${window.location.origin}/join?ref=${myCode}`
              navigator.clipboard.writeText(url).then(() => {
                setCopied(true); setTimeout(() => setCopied(false), 2000)
              })
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
            style={{ background: '#F3B4E310', color: '#8E8E93' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
            <span>{t('Common.copyRefUrl')}</span>
          </button>
          <p className="text-[10px] mt-2" style={{ color: '#636366' }}>
            {t('Common.shareCodeMsg')}
          </p>
        </div>
      </div>

      {/* ─── ファンクラブ会員番号 ─── */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
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
                    {fc.validUntil && <span className="text-[10px]" style={{ color: '#8E8E93' }}>〜{fc.validUntil}</span>}
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

      {/* ─── アプリ設定 ─── */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold mb-2" style={{ color: '#8E8E93' }}>{t('Common.appSettings')}</p>
        <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF' }}>

          {/* 通知 */}
          <button
            onClick={() => setNotifExpanded((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <span className="text-base w-6 text-center">🔔</span>
            <span className="flex-1 text-sm font-medium text-left" style={{ color: '#1C1C1E' }}>{t('Profile.notifSettings')}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2"
              style={{ transform: notifExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {notifExpanded && (
            <div style={{ borderTop: '1px solid #F0F0F5', background: '#FAFAFA' }}>
              {/* 朝の通知 */}
              <div className="px-5 py-3 flex items-center gap-3">
                <span className="text-sm flex-1" style={{ color: '#1C1C1E' }}>{t('Profile.notifMorning')}</span>
                <Toggle
                  on={profile.notif.morningOn}
                  onChange={(v) => updateNotif({ morningOn: v })}
                />
              </div>
              {profile.notif.morningOn && (
                <div className="px-5 pb-3 flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#8E8E93' }}>{t('Profile.notifTime')}</span>
                  <input
                    type="time"
                    value={profile.notif.morningTime}
                    onChange={(e) => updateNotif({ morningTime: e.target.value })}
                    className="px-3 py-1.5 rounded-lg text-sm outline-none"
                    style={{ background: '#F0F0F5', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
                  />
                </div>
              )}

              {/* 夜の通知 */}
              <div className="px-5 py-3 flex items-center gap-3" style={{ borderTop: '1px solid #F0F0F5' }}>
                <span className="text-sm flex-1" style={{ color: '#1C1C1E' }}>{t('Profile.notifEvening')}</span>
                <Toggle
                  on={profile.notif.eveningOn}
                  onChange={(v) => updateNotif({ eveningOn: v })}
                />
              </div>
              {profile.notif.eveningOn && (
                <div className="px-5 pb-3 flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#8E8E93' }}>{t('Profile.notifTime')}</span>
                  <input
                    type="time"
                    value={profile.notif.eveningTime}
                    onChange={(e) => updateNotif({ eveningTime: e.target.value })}
                    className="px-3 py-1.5 rounded-lg text-sm outline-none"
                    style={{ background: '#F0F0F5', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
                  />
                </div>
              )}

              {/* MYイベント前 */}
              <div className="px-5 py-3 flex items-center gap-3" style={{ borderTop: '1px solid #F0F0F5' }}>
                <span className="text-sm flex-1" style={{ color: '#1C1C1E' }}>{t('Profile.notifReminder')}</span>
                <Toggle
                  on={profile.notif.myEventReminder}
                  onChange={(v) => updateNotif({ myEventReminder: v })}
                />
              </div>
            </div>
          )}

          {/* LINE連携 */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: '1px solid #F0F0F5' }}>
            <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0"
              style={{ background: '#06C755', color: '#FFFFFF' }}>L</div>
            <span className="flex-1 text-sm font-medium" style={{ color: '#1C1C1E' }}>{t('Profile.linkLine')}</span>
            <button
              onClick={() => update({ lineLinked: !profile.lineLinked })}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={profile.lineLinked
                ? { background: '#F0F0F5', color: '#636366' }
                : { background: '#06C75520', color: '#06C755' }
              }
            >
              {profile.lineLinked ? t('Profile.linked') : t('Profile.linkNow')}
            </button>
          </div>

          {/* X連携 */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: '1px solid #F0F0F5' }}>
            <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: '#000000' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <span className="flex-1 text-sm font-medium" style={{ color: '#1C1C1E' }}>{t('Profile.linkX')}</span>
            <button
              onClick={() => update({ xLinked: !profile.xLinked })}
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={profile.xLinked
                ? { background: '#F0F0F5', color: '#636366' }
                : { background: '#00000010', color: '#1C1C1E' }
              }
            >
              {profile.xLinked ? t('Profile.linked') : t('Profile.linkNow')}
            </button>
          </div>

          {/* 言語 */}
          <button
            onClick={() => setShowLangPicker(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5"
            style={{ borderTop: '1px solid #F0F0F5' }}
          >
            <span className="text-base w-6 text-center">🌐</span>
            <span className="flex-1 text-sm font-medium text-left" style={{ color: '#1C1C1E' }}>{t('Common.language')}</span>
            <span className="text-xs mr-1" style={{ color: '#8E8E93' }}>
              {LANGUAGES.find((l) => l.code === profile.language)?.flag}{' '}
              {LANGUAGES.find((l) => l.code === profile.language)?.label}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* 居住国 */}
          <button
            onClick={() => setShowCountryPicker(true)}
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
      </div>

      {/* 画像クロップモーダル */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspectRatio={cropTarget === 'banner' ? 2 : 1}
          circle={cropTarget === 'avatar'}
          onConfirm={onCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* 言語ピッカー */}
      {showLangPicker && (
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
                    onClick={() => { update({ language: l.code }); document.cookie = `NEXT_LOCALE=${l.code};path=/;max-age=31536000`; setShowLangPicker(false); window.location.reload() }}
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
        </div>
      )}

      {/* 居住国ピッカー */}
      {showCountryPicker && (
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
        </div>
      )}

      <div className="mx-4 mb-4" style={{ height: 1, background: '#E5E5EA' }} />

      {/* ─── サインアウト＋退会 ─── */}
      <div className="px-4 pb-28 flex flex-col gap-3">
        {/* ご意見フォーム */}
        <button
          onClick={() => { setFeedbackMsg(''); setFeedbackState('idle'); setShowFeedback(true) }}
          className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: '#FFFFFF', color: '#636366' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          {t('Profile.feedbackHere')}
        </button>

        {/* サインアウト */}
        {showSignOutConfirm ? (
          <div className="flex gap-3">
            <button onClick={() => setShowSignOutConfirm(false)}
              className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
              style={{ background: '#FFFFFF', color: '#636366' }}>
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
            style={{ background: '#FFFFFF', color: '#EF4444' }}>
            {t('Profile.signOut')}
          </button>
        )}

        {/* 退会 */}
        <button
          onClick={() => { setDeleteAgreed(false); setShowDeleteConfirm(true) }}
          className="w-full py-3 rounded-xl text-sm font-medium"
          style={{ background: 'transparent', color: '#C7C7CC' }}
        >
          {t('Profile.deleteAccount')}
        </button>

        <p className="text-center text-xs" style={{ color: '#C7C7CC' }}>Connects+ v1.0.0</p>
      </div>

      {/* ─── 退会確認モーダル ─── */}
      {showDeleteConfirm && (
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
        </div>
      )}

      {/* ─── ご意見フォームモーダル ─── */}
      {showFeedback && (
        <div
          className="fixed inset-0 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
          onClick={() => setShowFeedback(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl p-5"
            style={{ background: '#FFFFFF', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
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
                  rows={5}
                  maxLength={500}
                  className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none mb-1"
                  style={{ background: '#F8F9FA', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
                />
                <p className="text-[10px] text-right mb-4" style={{ color: '#C7C7CC' }}>{feedbackMsg.length}/500</p>
                {feedbackState === 'error' && (
                  <p className="text-xs mb-3 text-center" style={{ color: '#EF4444' }}>{t('Profile.feedbackError')}</p>
                )}
                <button
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
        </div>
      )}

      {/* ─── FC モーダル ─── */}
      {fcModal !== null && (
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
            {/* ハンドル＋タイトル */}
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

            {/* スクロールエリア — 明示的高さで確実にスクロール */}
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

            {/* ボタン */}
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
        </div>
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
