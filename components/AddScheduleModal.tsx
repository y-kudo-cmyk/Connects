'use client'

import { useState, useRef, useEffect } from 'react'
import { scheduleTagConfig, type ScheduleTag } from '@/lib/config/tags'
import { useAuth } from '@/lib/supabase/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { compressImage } from '@/lib/useMyEntries'

const supabase = createClient()

export default function AddScheduleModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
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
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const main = document.querySelector('main') as HTMLElement | null
    const prevBody = document.body.style.overflow
    const prevMain = main?.style.overflow ?? ''
    document.body.style.overflow = 'hidden'
    if (main) main.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevBody
      if (main) main.style.overflow = prevMain
    }
  }, [])

  const handleImage = async (files: FileList | null) => {
    if (!files?.[0]) return
    setImageUrl(await compressImage(files[0], 1200, 0.85))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !startDate) return
    setSaving(true)

    const startIso = startTime
      ? `${startDate}T${startTime}:00`
      : `${startDate}T00:00:00`
    const endIso = endDate ? `${endDate}T00:00:00` : null

    await supabase.from('events').insert({
      tag,
      artist_id: 'seventeen',
      submitted_by: user?.id ?? null,
      related_artists: '',
      event_title: title.trim(),
      sub_event_title: '',
      start_date: startIso,
      end_date: endIso,
      spot_name: venue || '',
      spot_address: '',
      lat: null,
      lng: null,
      country: country || '',
      image_url: imageUrl || '',
      source_url: sourceUrl || '',
      notes: notes || '',
      status: 'pending',
      verified_count: 0,
    })

    setSaving(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col justify-end">
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
        <div className="relative rounded-t-2xl px-6 py-10 flex flex-col items-center gap-3"
          style={{ background: '#F8F9FA' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.15)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm font-bold text-center" style={{ color: '#1C1C1E' }}>{t('schedulePosted')}</p>
          <button onClick={onClose}
            className="mt-2 px-8 py-3 rounded-xl text-sm font-bold"
            style={{ background: '#F3B4E3', color: '#FFFFFF' }}>
            {t('close')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div className="relative flex flex-col rounded-t-2xl overflow-hidden"
        style={{ background: '#F8F9FA', height: '88dvh' }}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style={{ borderBottom: '1px solid #E5E5EA' }}>
          <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{t('addSchedule')}</p>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 flex flex-col gap-4"
          style={{ paddingBottom: 120, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          {/* タイトル */}
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
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
            placeholder={t('venuePlaceholder')}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />

          {/* 画像 */}
          {imageUrl ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.7)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-24 rounded-xl flex flex-col items-center justify-center gap-1"
              style={{ border: '2px dashed #E5E5EA', color: '#8E8E93' }}>
              <span className="text-2xl">📷</span>
              <span className="text-xs">{t('uploadImage')}</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleImage(e.target.files)} />

          {/* ソースURL */}
          <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
            placeholder={`${t('source')} URL`}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />

          {/* 備考 */}
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notesPlaceholder')}
            rows={3}
            className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
        </div>

        {/* フッター（投稿ボタン） */}
        <div className="flex-shrink-0 px-4 pt-3"
          style={{
            background: '#F8F9FA',
            borderTop: '1px solid #E5E5EA',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          }}>
          <button onClick={handleSubmit} disabled={!title.trim() || !startDate || saving}
            className="w-full py-3.5 rounded-2xl text-sm font-bold"
            style={{
              background: title.trim() && startDate ? '#F3B4E3' : '#E5E5EA',
              color: title.trim() && startDate ? '#FFFFFF' : '#8E8E93',
            }}>
            {saving ? t('saving') : t('addScheduleShort')}
          </button>
        </div>
      </div>
    </div>
  )
}
