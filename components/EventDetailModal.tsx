'use client'

import { useState, useRef, useEffect } from 'react'
import { scheduleTagConfig, type ScheduleTag } from '@/lib/config/tags'
import type { AppEvent } from '@/lib/supabase/adapters'
import { useRouter } from '@/i18n/navigation'
import { useMyEntries } from '@/lib/useMyEntries'
import { useAuth } from '@/lib/supabase/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useVoting, VOTE_THRESHOLD } from '@/lib/supabase/useVoting'
import { uploadImage } from '@/lib/supabase/uploadImage'
import { countryFlag, cityToCountryCode } from '@/lib/countryUtils'
import { seventeenMembers } from '@/lib/config/constants'
import { useTranslations } from 'next-intl'

const supabase = createClient()

function md(s: string) {
  const d = new Date(s)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function formatDateTime(date: string, time: string, dateEnd?: string, timeEnd?: string): string {
  const hasTime = time && time !== '00:00'
  const start = `${md(date)}${hasTime ? ` ${time}` : ''}`
  if (!dateEnd) return start
  const endTime = timeEnd && timeEnd !== '00:00' ? ` ${timeEnd}` : ''
  return `${start} 〜 ${md(dateEnd)}${endTime}`
}

// DAY names from i18n

export default function EventDetailModal({
  event,
  onClose,
  onRefresh,
  showConfirmButton = true,
}: {
  event: AppEvent
  onClose: () => void
  onRefresh?: () => Promise<void>
  showConfirmButton?: boolean
}) {
  const router = useRouter()
  const { addEntry, hasEntry, findEntryByEventId } = useMyEntries()
  const { user } = useAuth()
  const t = useTranslations()
  const dayNames = t.raw('Calendar.dayNames') as string[]
  const { hasVoted, voteCount, isConfirmed, loading: voteLoading, submitVote, refetch: refetchVotes } = useVoting('event', event.id, user?.id ?? null)
  const [userRole, setUserRole] = useState<string>('user')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editTitle, setEditTitle] = useState(event.title)
  const [editVenue, setEditVenue] = useState(event.venue ?? '')
  const [editNotes, setEditNotes] = useState(event.notes ?? '')
  const [editStartDate, setEditStartDate] = useState(event.date)
  const [editStartTime, setEditStartTime] = useState(event.time !== '00:00' ? event.time : '')
  const [editEndDate, setEditEndDate] = useState(event.dateEnd ?? '')
  const [editSourceUrl, setEditSourceUrl] = useState(event.sourceUrl ?? '')
  const [editImageUrl, setEditImageUrl] = useState(event.image ?? '')
  const [editMembers, setEditMembers] = useState<string[]>(
    (event.relatedArtists || '').split('#').map(s => s.trim()).filter(s => s && s !== 'SEVENTEEN')
  )
  const [editSaving, setEditSaving] = useState(false)
  const [editRequestSent, setEditRequestSent] = useState(false)
  const imageFileRef = useRef<HTMLInputElement>(null)

  // admin判定
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.role) setUserRole(data.role) })
  }, [user?.id])

  const isOwner = user?.id && event.submittedBy === user.id
  const isAdmin = userRole === 'admin'
  const canDelete = isOwner || isAdmin

  const handleDelete = async () => {
    await supabase.from('event_votes').delete().eq('event_id', event.id)
    const { error } = await supabase.from('events').delete().eq('id', event.id)
    if (error) {
      console.error('Delete error:', error.message)
      return
    }
    await onRefresh?.()
    onClose()
  }

  const [imageUploading, setImageUploading] = useState(false)
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !files[0]) return
    setImageUploading(true)
    const url = await uploadImage('event-images', files[0], 1200, 0.85)
    if (url) setEditImageUrl(url)
    setImageUploading(false)
  }

  const firstTag = event.tags?.[0] as ScheduleTag | undefined
  const cfg = firstTag && scheduleTagConfig[firstTag]
    ? scheduleTagConfig[firstTag]
    : { label: 'EVENT', icon: '📌', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' }
  const isPeriod = !!event.dateEnd
  const dateTime = formatDateTime(event.date, event.time, event.dateEnd, event.timeEnd)
  const startD = new Date(event.date)
  const dayJa = dayNames[startD.getDay()]
  const imported = hasEntry(event.id)

  const handleEditSave = async () => {
    setEditSaving(true)
    const userId = user?.id

    // 日時の組み立て
    const newStartDate = editStartDate && editStartTime
      ? `${editStartDate}T${editStartTime}:00`
      : editStartDate ? `${editStartDate}T00:00:00` : null
    const newEndDate = editEndDate
      ? `${editEndDate}T00:00:00`
      : null

    if (isConfirmed) {
      // 承認済み → 修正依頼として投稿
      const changes: { field_name: string; old_value: string; new_value: string }[] = []
      if (editTitle !== event.title) changes.push({ field_name: 'event_title', old_value: event.title, new_value: editTitle })
      if (editVenue !== (event.venue ?? '')) changes.push({ field_name: 'spot_name', old_value: event.venue ?? '', new_value: editVenue })
      if (editNotes !== (event.notes ?? '')) changes.push({ field_name: 'notes', old_value: event.notes ?? '', new_value: editNotes })
      if (editSourceUrl !== (event.sourceUrl ?? '')) changes.push({ field_name: 'source_url', old_value: event.sourceUrl ?? '', new_value: editSourceUrl })
      if (editImageUrl !== (event.image ?? '')) changes.push({ field_name: 'image_url', old_value: event.image ?? '', new_value: editImageUrl })
      if (newStartDate && editStartDate !== event.date) changes.push({ field_name: 'start_date', old_value: event.date, new_value: newStartDate })
      if (editEndDate !== (event.dateEnd ?? '')) changes.push({ field_name: 'end_date', old_value: event.dateEnd ?? '', new_value: newEndDate ?? '' })

      if (changes.length > 0) {
        for (const c of changes) {
          await supabase.from('edit_requests').insert({
            event_id: event.id,
            ...c,
            submitted_by: userId,
          })
        }
        setEditRequestSent(true)
      }
    } else {
      // 直接更新 + カウントリセット
      const relatedArtists = editMembers.length > 0
        ? '#SEVENTEEN ' + editMembers.map(m => `#${m}`).join(' ')
        : '#SEVENTEEN'
      const updates: Record<string, any> = {
        event_title: editTitle,
        spot_name: editVenue,
        notes: editNotes,
        source_url: editSourceUrl,
        image_url: editImageUrl,
        related_artists: relatedArtists,
        verified_count: 0,
        status: 'pending',
      }
      if (newStartDate) updates.start_date = newStartDate
      if (newEndDate !== null) updates.end_date = newEndDate || null
      await fetch('/api/update-spot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotId: event.id, updates, _table: 'events' }),
      })
      // 既存の承認投票を削除
      await supabase.from('event_votes').delete().eq('event_id', event.id)
      // 編集アクティビティ記録
      if (userId) {
        supabase.from('user_activity').insert({ user_id: userId, action: 'edit', detail: event.title }).then(() => {})
      }
    }

    await refetchVotes()
    await onRefresh?.()
    setEditSaving(false)
    setEditing(false)
    onClose()
  }

  const handleAddToMy = () => {
    if (!imported) {
      addEntry({
        id: Date.now().toString(),
        date: event.date,
        dateEnd: event.dateEnd,
        eventId: event.id,
        title: event.title,
        subTitle: event.subTitle,
        type: event.type,
        tags: event.tags ? [...event.tags] : [],
        color: event.artistColor,
        venue: event.venue,
        city: event.city,
        time: event.time,
        ticketImages: [],
        memo: '',
        images: event.image ? [event.image] : [],
        createdAt: new Date().toISOString(),
        sourceUrl: event.sourceUrl,
        notes: event.notes,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end"
      onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
      <div
        className="relative flex flex-col rounded-t-2xl overflow-hidden"
        style={{ background: '#F8F9FA', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ドラッグハンドル */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>

        {/* ヘッダー: 承認ステータス + 閉じるボタン */}
        <div className="flex items-center justify-between px-4 pt-1 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* 承認バッジ */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={isConfirmed
                ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' }
                : { background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }
              }
            >
              {isConfirmed ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('Schedule.approved')}
                </>
              ) : (
                <>
                  <span className="font-black">{voteCount}/{VOTE_THRESHOLD}</span>
                  {t('Schedule.pendingApproval')}
                </>
              )}
            </div>
            {event.submittedByName && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: '#F0F0F5', color: '#636366' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                {event.submittedByName}
              </div>
            )}
          </div>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* 画像 */}
          {editing ? (
            <div className="mb-4">
              <label className="text-xs font-bold mb-1.5 block" style={{ color: '#636366' }}>{t('Schedule.imageLabel')}</label>
              {editImageUrl ? (
                <div>
                  <div className="rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editImageUrl} alt="" className="w-full" style={{ display: 'block' }} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => imageFileRef.current?.click()}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                      style={{ background: '#F0F0F5', color: '#636366' }}>
                      {t('Schedule.changeImage')}
                    </button>
                    <button onClick={() => setEditImageUrl('')}
                      className="py-2.5 px-4 rounded-xl text-xs font-bold"
                      style={{ background: '#FEE2E2', color: '#EF4444' }}>
                      {t('Common.delete')}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => !imageUploading && imageFileRef.current?.click()}
                  className="w-full h-32 rounded-2xl flex flex-col items-center justify-center gap-2"
                  style={{ border: '2px dashed #E5E5EA', color: '#8E8E93', opacity: imageUploading ? 0.5 : 1 }}>
                  <span className="text-3xl">{imageUploading ? '⏳' : '📷'}</span>
                  <span className="text-xs">{imageUploading ? t('Schedule.imageUploading') : t('Schedule.uploadImage')}</span>
                </button>
              )}
              <input ref={imageFileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)} />
            </div>
          ) : event.image ? (
            <div className="rounded-2xl overflow-hidden mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.image} alt={event.title}
                className="w-full rounded-2xl" style={{ display: 'block' }}
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  target.parentElement!.querySelector('[data-fallback]')!.removeAttribute('hidden')
                }}
              />
              <div data-fallback hidden className="flex items-center justify-center rounded-2xl"
                style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #E8D5F5 0%, #D5E5F5 50%, #F5D5E8 100%)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="" className="w-16 h-16 opacity-40" />
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <button onClick={() => setEditing(true)}
                className="w-full rounded-2xl flex flex-col items-center justify-center gap-2"
                style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #E8D5F5 0%, #D5E5F5 50%, #F5D5E8 100%)', cursor: 'pointer' }}>
                <span className="text-3xl">📷</span>
                <span className="text-xs font-bold" style={{ color: '#8E8E93' }}>{t('Schedule.addImage')}</span>
              </button>
              <input ref={imageFileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)} />
            </div>
          )}

          {/* タグ */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {(event.tags ?? []).map((tag) => {
              const tc = scheduleTagConfig[tag as ScheduleTag] ?? { label: tag, icon: '📌', color: '#8E8E93', bg: 'rgba(142,142,147,0.15)' }
              return (
                <span key={tag} className="text-[11px] font-bold px-2 py-1 rounded-lg"
                  style={{ background: tc.bg, color: tc.color }}>
                  {tc.icon} {tc.label}
                </span>
              )
            })}
            {isPeriod && (
              <span className="text-[11px] font-bold px-2 py-1 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.06)', color: '#8E8E93' }}>{t('Common.period')}</span>
            )}
          </div>

          {/* タイトル（編集可能） */}
          {editing ? (
            <textarea value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              rows={3}
              className="w-full text-base font-black leading-snug mb-2 px-3 py-2.5 rounded-xl outline-none resize-none"
              style={{ color: '#1C1C1E', background: '#FFFFFF', border: '1.5px solid #F3B4E3' }} />
          ) : (
            <h2 className="text-lg font-black leading-snug mb-1" style={{ color: '#1C1C1E' }}>
              {event.title}
            </h2>
          )}

          {/* サブタイトル */}
          {event.subTitle && (
            <p className="text-sm mb-2" style={{ color: '#636366' }}>{event.subTitle}</p>
          )}

          {/* 詳細情報 */}
          <div className="flex flex-col gap-3 mt-3">
            {/* 日程 */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.color + '15' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="flex-1">
                {editing ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: '#FFFFFF', border: '1.5px solid #F3B4E3', color: '#1C1C1E' }} />
                      <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-28 px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: '#FFFFFF', border: '1.5px solid #F3B4E3', color: '#1C1C1E' }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#8E8E93' }}>〜</span>
                      <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: '#FFFFFF', border: '1.5px solid #E5E5EA', color: '#1C1C1E' }} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>
                    {dateTime}（{dayJa}）
                  </p>
                )}
              </div>
            </div>

            {/* 場所（編集可能） */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.color + '15' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="flex-1">
                {editing ? (
                  <input type="text" value={editVenue} onChange={(e) => setEditVenue(e.target.value)}
                    placeholder={t('Schedule.venuePlaceholder')}
                    className="w-full text-sm font-bold px-3 py-2 rounded-xl outline-none"
                    style={{ color: '#1C1C1E', background: '#FFFFFF', border: '1.5px solid #F3B4E3' }} />
                ) : (
                  <>
                    {event.venue && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const cc = cityToCountryCode(event.city ?? '')
                          const q = encodeURIComponent(event.venue + (event.city ? ` ${event.city}` : ''))
                          const url = cc === 'KR'
                            ? `https://map.naver.com/v5/search/${q}`
                            : `https://www.google.com/maps/search/?api=1&query=${q}`
                          window.open(url, '_blank', 'noopener,noreferrer')
                        }}
                        className="flex items-center gap-1.5 text-left"
                      >
                        <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{event.venue}</p>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" className="flex-shrink-0">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </button>
                    )}
                    {event.city && (
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#8E8E93' }}>
                        <span>{countryFlag(cityToCountryCode(event.city))}</span>{event.city}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 備考（編集可能） */}
            {(event.notes || editing) && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.color + '15' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="flex-1">
                  {editing ? (
                    <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                      placeholder={t('Schedule.notesPlaceholder')}
                      rows={2}
                      className="w-full text-sm px-3 py-2 rounded-xl outline-none resize-none"
                      style={{ color: '#1C1C1E', background: '#FFFFFF', border: '1.5px solid #F3B4E3' }} />
                  ) : (
                    <p className="text-sm" style={{ color: '#636366', whiteSpace: 'pre-wrap' }}>{event.notes}</p>
                  )}
                </div>
              </div>
            )}

            {/* ソース */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.color + '15' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
              <div className="flex-1">
                {editing ? (
                  <input type="url" value={editSourceUrl} onChange={(e) => setEditSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: '#FFFFFF', border: '1.5px solid #F3B4E3', color: '#1C1C1E' }} />
                ) : event.sourceUrl ? (
                  <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <p className="text-sm font-semibold" style={{ color: cfg.color }}>
                      {event.sourceName ?? t('Schedule.viewSource')}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: '#8E8E93' }}>{event.sourceUrl}</p>
                  </a>
                ) : (
                  <p className="text-xs" style={{ color: '#C7C7CC' }}>{t('Schedule.noSourceUrl')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* メンバータグ */}
        {editing && (
          <div className="px-4 mb-2">
            <label className="text-xs font-bold mb-1.5 block" style={{ color: '#636366' }}>{t('Schedule.memberLabel')}</label>
            <div className="flex flex-wrap gap-1.5">
              {seventeenMembers.map((m) => {
                const selected = editMembers.includes(m.name)
                return (
                  <button key={m.id} onClick={() => setEditMembers(prev => selected ? prev.filter(n => n !== m.name) : [...prev, m.name])}
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
        )}
        {!editing && event.relatedArtists && event.relatedArtists !== '#SEVENTEEN' && (
          <div className="px-4 mb-2 flex flex-wrap gap-1">
            {event.relatedArtists.split('#').map(s => s.trim()).filter(s => s && s !== 'SEVENTEEN').map(name => {
              const m = seventeenMembers.find(x => x.name === name)
              return (
                <span key={name} className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: (m?.color ?? '#9A9A9F') + '18', color: m?.color ?? '#9A9A9F' }}>
                  #{name}
                </span>
              )
            })}
          </div>
        )}

        {/* 修正依頼送信済みバナー */}
        {editRequestSent && (
          <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-xs font-bold" style={{ color: '#34D399' }}>{t('Schedule.editRequestSentMsg')}</p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="px-4 pt-3 flex-shrink-0 flex flex-col gap-2"
          style={{ borderTop: '1px solid #E5E5EA', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>

          {/* 承認 / 編集ボタン行 */}
          {showConfirmButton && (
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button onClick={() => { setEditing(false); setConfirmDelete(false) }}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold"
                    style={{ background: '#F0F0F5', color: '#636366' }}>
                    {t('Common.cancel')}
                  </button>
                  <button onClick={handleEditSave} disabled={editSaving}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold"
                    style={{ background: '#34D399', color: '#FFFFFF' }}>
                    {editSaving ? t('Common.saving') : isConfirmed ? t('Schedule.submitEditRequest') : t('Schedule.editAndApprove')}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
                    style={{ background: '#F0F0F5', color: '#636366' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {isConfirmed ? t('Schedule.editRequest') : t('Schedule.editButton')}
                  </button>
                  {user ? (
                    <button onClick={submitVote} disabled={hasVoted || voteLoading}
                      className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
                      style={hasVoted
                        ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' }
                        : { background: '#34D399', color: '#FFFFFF' }
                      }>
                      {hasVoted ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {t('Schedule.approved')}
                        </>
                      ) : (
                        <>{t('Schedule.approveButton')}（{voteCount}/{VOTE_THRESHOLD}）</>
                      )}
                    </button>
                  ) : (
                    <button onClick={() => router.push('/login')}
                      className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
                      style={{ background: '#34D399', color: '#FFFFFF' }}>
                      {t('Schedule.signInToApprove')}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* 削除ボタン（投稿者本人 or 運営者） */}
          {editing && canDelete && (
            confirmDelete ? (
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#F0F0F5', color: '#636366' }}>
                  {t('Common.cancel')}
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#EF4444', color: '#FFFFFF' }}>
                  {t('My.confirmDelete')}
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)' }}>
                {t('Schedule.deleteEvent')}
              </button>
            )
          )}

          {/* MYに追加 / MY詳細へ */}
          {imported ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                const myEntry = findEntryByEventId(event.id)
                if (myEntry) {
                  router.push(`/my?entry=${myEntry.id}`)
                  setTimeout(onClose, 100)
                }
              }}
              className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(243,180,227,0.15)', color: '#F3B4E3' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {t('Schedule.customizeSchedule')}
            </button>
          ) : (
            <button onClick={handleAddToMy}
              className="w-full py-3.5 rounded-xl text-sm font-bold"
              style={{ background: '#F3B4E3', color: '#FFFFFF' }}>
              {t('Schedule.addToMy')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
