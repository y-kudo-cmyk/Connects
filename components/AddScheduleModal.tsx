'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { scheduleTagConfig, type ScheduleTag } from '@/lib/config/tags'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/supabase/useAuth'
import { useTranslations } from 'next-intl'
import { uploadImage } from '@/lib/supabase/uploadImage'
import { seventeenMembers } from '@/lib/config/constants'

const supabase = createClient()

export default function AddScheduleModal({ onClose, onRefresh }: { onClose: () => void; onRefresh?: () => Promise<void> }) {
  const t = useTranslations()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState<ScheduleTag>('EVENT')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [venue, setVenue] = useState('')
  const [country, setCountry] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [members, setMembers] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const handleImage = (files: FileList | null) => {
    if (!files?.[0]) return
    setImageFile(files[0])
    // プレビュー用にローカルURLを生成
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(files[0])
  }

  const handleSubmit = async () => {
    if (!title.trim() || !startDate) return
    setSaving(true)

    // 画像があればSupabase Storageにアップロード
    let finalImageUrl = ''
    if (imageFile) {
      const url = await uploadImage('event-images', imageFile, 1200, 0.85)
      if (url) finalImageUrl = url
    }

    const startIso = startTime
      ? `${startDate}T${startTime}:00`
      : `${startDate}T00:00:00`
    const endIso = endDate ? `${endDate}T00:00:00` : null

    const { error } = await supabase.from('events').insert({
      tag,
      artist_id: 'A000000',
      related_artists: members.length > 0 ? '#SEVENTEEN ' + members.map(n => `#${n}`).join(' ') : '',
      event_title: title.trim(),
      sub_event_title: '',
      start_date: startIso,
      end_date: endIso,
      spot_name: venue || '',
      spot_address: '',
      lat: null,
      lng: null,
      country: country || '',
      image_url: finalImageUrl,
      source_url: sourceUrl || '',
      notes: notes || '',
      submitted_by: user?.id ?? null,
      status: 'pending',
      verified_count: 0,
    })

    if (error) {
      console.error('Event insert error:', error.message)
      setSubmitError(t('Schedule.postFailed'))
      setSaving(false)
      return
    }

    await onRefresh?.()
    setSaving(false)
    setDone(true)
  }

  if (!mounted) return null

  if (done) {
    return createPortal(
      <div className="fixed inset-0 z-[60] flex flex-col justify-end">
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
        <div className="relative rounded-t-2xl px-6 py-10 flex flex-col items-center gap-3"
          style={{ background: '#F8F9FA' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.15)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm font-bold text-center" style={{ color: '#1C1C1E' }}>{t('Schedule.schedulePosted')}</p>
          <button onClick={onClose}
            className="mt-2 px-8 py-3 rounded-xl text-sm font-bold"
            style={{ background: '#F3B4E3', color: '#FFFFFF' }}>
            {t('Common.close')}
          </button>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div className="relative flex flex-col rounded-t-2xl overflow-hidden"
        style={{ background: '#F8F9FA', maxHeight: '90vh' }}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style={{ borderBottom: '1px solid #E5E5EA' }}>
          <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{t('Schedule.addSchedule')}</p>
          <div className="flex items-center gap-2">
            <button onClick={handleSubmit} disabled={!title.trim() || !startDate || saving}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{
                background: title.trim() && startDate ? '#F3B4E3' : '#E5E5EA',
                color: title.trim() && startDate ? '#FFFFFF' : '#8E8E93',
              }}>
              {saving ? t('Common.saving') : t('Schedule.addScheduleShort')}
            </button>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* タイトル */}
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={t('Schedule.titlePlaceholder')}
            className="w-full px-3 py-3 rounded-xl text-base font-bold outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
            autoFocus />

          {/* タグ */}
          <div className="flex gap-1.5 flex-wrap">
            {(Object.entries(scheduleTagConfig) as [ScheduleTag, typeof scheduleTagConfig[ScheduleTag]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setTag(key)}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                style={tag === key
                  ? { background: cfg.color, color: '#FFFFFF' }
                  : { background: cfg.bg, color: cfg.color }
                }>{cfg.icon} {cfg.label}</button>
            ))}
          </div>

          {/* メンバー */}
          <div>
            <label className="text-xs font-bold mb-1.5 block" style={{ color: '#636366' }}>{t('Schedule.memberLabel')}</label>
            <div className="flex flex-wrap gap-1.5">
              {seventeenMembers.map((m) => {
                const selected = members.includes(m.name)
                return (
                  <button key={m.id} onClick={() => setMembers(prev => selected ? prev.filter(n => n !== m.name) : [...prev, m.name])}
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

          {/* 日時 */}
          <div className="flex gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              className="w-28 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#8E8E93' }}>〜</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
          </div>

          {/* 会場 */}
          <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)}
            placeholder={t('Schedule.venuePlaceholder')}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />

          {/* 画像 */}
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              <button onClick={() => { setImagePreview(''); setImageFile(null) }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.7)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <label
              className="w-full h-24 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer"
              style={{ border: '2px dashed #E5E5EA', color: '#8E8E93' }}>
              <span className="text-2xl">📷</span>
              <span className="text-xs">{t('Schedule.uploadImage')}</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => handleImage(e.target.files)} />
            </label>
          )}

          {/* ソースURL */}
          <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
            placeholder={`${t('Schedule.source')} URL`}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />

          {/* 備考 */}
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder={t('Schedule.notesPlaceholder')}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />

          {submitError && (
            <p className="text-xs text-center" style={{ color: '#EF4444' }}>{submitError}</p>
          )}
        </div>

        <div style={{ height: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} />
      </div>
    </div>,
    document.body
  )
}
