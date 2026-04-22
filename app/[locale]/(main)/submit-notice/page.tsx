'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/supabase/useAuth'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/supabase/uploadImage'
import { Link } from '@/i18n/navigation'

type Step = 'input' | 'analyzing' | 'preview' | 'submitting' | 'done'

type AnalyzedEvent = {
  event_title: string
  sub_event_title: string
  start_date: string
  end_date: string | null
  start_time: string
  tag: string
  country: string
  spot_name: string
  source_url: string
  image_url: string
  confidence: number
  notes: string
}

const TAG_OPTIONS = [
  'CONCERT',
  'TICKET',
  'CD',
  'LUCKY_DRAW',
  'POPUP',
  'MERCH',
  'RELEASE',
  'BIRTHDAY',
  'MAGAZINE',
  'EVENT',
  'TV',
  'YOUTUBE',
  'RADIO',
  'LIVEVIEWING',
  'INFO',
]

const COUNTRY_OPTIONS = ['', 'JP', 'KR', 'TW', 'MO', 'CN', 'US', 'HK', 'TH', 'SG', 'PH', 'ID', 'MY', 'VN', 'AU', 'GB', 'DE', 'FR', 'CA']

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function extractBase64(dataUrl: string): { base64: string; mimeType: string } {
  const [header, b64] = dataUrl.split(',')
  const match = header.match(/:(.*?);/)
  const mimeType = match?.[1] ?? 'image/jpeg'
  return { base64: b64 ?? '', mimeType }
}

export default function SubmitNoticePage() {
  const t = useTranslations('SubmitNotice')
  const tCommon = useTranslations('Common')
  const { user } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [roleLoaded, setRoleLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setRole(data?.role ?? null)
        setRoleLoaded(true)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const [step, setStep] = useState<Step>('input')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [note, setNote] = useState('')
  const [events, setEvents] = useState<AnalyzedEvent[]>([])
  const [error, setError] = useState('')
  const [insertedCount, setInsertedCount] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  if (!user || !roleLoaded) return null

  const allowed = role === 'fam' || role === 'admin'
  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: '100vh', background: '#F8F9FA' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(243,180,227,0.15)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-black" style={{ color: '#1C1C1E' }}>{t('title')}</h1>
          <p className="text-sm text-center leading-relaxed" style={{ color: '#8E8E93' }}>
            {t('forbidden')}
          </p>
          <Link href="/" className="text-sm font-bold px-4 py-2 rounded-full" style={{ background: '#F0F0F5', color: '#636366' }}>
            {tCommon('back')}
          </Link>
        </div>
      </div>
    )
  }

  const handleImageChoose = async (file: File | null) => {
    if (!file) return
    setImageFile(file)
    const url = await readFileAsDataURL(file)
    setImagePreview(url)
    setError('')
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageChoose(file)
    }
  }

  const handleAnalyze = async () => {
    if (!imagePreview) {
      setError(t('errNoImage'))
      return
    }
    setStep('analyzing')
    setError('')
    try {
      const { base64, mimeType } = extractBase64(imagePreview)
      const res = await fetch('/api/analyze-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          sourceUrl: sourceUrl.trim(),
          note: note.trim(),
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const list: AnalyzedEvent[] = Array.isArray(data?.events) ? data.events : []
      if (list.length === 0) {
        setError(t('errNoEventsExtracted'))
        setStep('input')
        return
      }
      // sourceUrl が空なら全件に適用
      const withSource = list.map((e) => ({
        ...e,
        source_url: e.source_url || sourceUrl.trim(),
      }))
      setEvents(withSource)
      setStep('preview')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'analyze failed'
      setError(`${t('errAnalyzeFailed')}: ${msg}`)
      setStep('input')
    }
  }

  const updateEvent = (idx: number, patch: Partial<AnalyzedEvent>) => {
    setEvents((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)))
  }

  const removeEvent = (idx: number) => {
    setEvents((prev) => prev.filter((_, i) => i !== idx))
  }

  const addEmptyEvent = () => {
    setEvents((prev) => [
      ...prev,
      {
        event_title: '',
        sub_event_title: '',
        start_date: '',
        end_date: null,
        start_time: '',
        tag: 'INFO',
        country: '',
        spot_name: '',
        source_url: sourceUrl.trim(),
        image_url: '',
        confidence: 0,
        notes: '',
      },
    ])
  }

  const handleSubmit = async () => {
    if (events.length === 0) {
      setError(t('errNoEvents'))
      return
    }
    // 最低限のチェック: event_title + start_date
    for (let i = 0; i < events.length; i++) {
      const e = events[i]
      if (!e.event_title.trim()) {
        setError(t('errTitleRequired', { index: i + 1 }))
        return
      }
      if (e.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(e.start_date)) {
        setError(t('errDateFormat', { index: i + 1 }))
        return
      }
    }
    setStep('submitting')
    setError('')
    try {
      // 1. 画像を Storage にアップロード
      let imageUrl = ''
      if (imageFile) {
        const uploaded = await uploadImage('notice-images', imageFile, 1600, 0.85)
        if (uploaded) imageUrl = uploaded
      }

      // 2. events を INSERT
      const res = await fetch('/api/submit-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, imageUrl }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setInsertedCount(data?.inserted ?? 0)
      setStep('done')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'submit failed'
      setError(`${t('errSubmitFailed')}: ${msg}`)
      setStep('preview')
    }
  }

  const resetAll = () => {
    setStep('input')
    setImageFile(null)
    setImagePreview('')
    setSourceUrl('')
    setNote('')
    setEvents([])
    setError('')
    setInsertedCount(0)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(243,180,227,0.15)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black" style={{ color: '#1C1C1E' }}>{t('title')}</h1>
            <p className="text-xs" style={{ color: '#8E8E93' }}>{t('subtitle')}</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4 text-[10px] font-bold tracking-wider" style={{ color: '#8E8E93' }}>
          <span style={{ color: step === 'input' ? '#F3B4E3' : undefined }}>1. {t('stepInput')}</span>
          <span>→</span>
          <span style={{ color: step === 'preview' ? '#F3B4E3' : undefined }}>2. {t('stepPreview')}</span>
          <span>→</span>
          <span style={{ color: step === 'done' ? '#F3B4E3' : undefined }}>3. {t('stepDone')}</span>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        {/* STEP 1: INPUT */}
        {step === 'input' && (
          <div className="flex flex-col gap-4">
            {/* Image uploader */}
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: '#636366' }}>{t('imageLabel')} *</label>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E5EA' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="preview" className="w-full h-auto max-h-[60vh] object-contain" />
                  <button
                    onClick={() => { setImagePreview(''); setImageFile(null) }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className="w-full h-40 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                  style={{
                    border: `2px dashed ${dragOver ? '#F3B4E3' : '#E5E5EA'}`,
                    color: '#8E8E93',
                    background: dragOver ? 'rgba(243,180,227,0.05)' : '#FFFFFF',
                  }}
                >
                  <span className="text-3xl">📷</span>
                  <span className="text-xs">{t('imageHint')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChoose(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            {/* Source URL */}
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: '#636366' }}>{t('sourceUrlLabel')}</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={t('sourceUrlPlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
              />
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: '#636366' }}>{t('noteLabel')}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={t('notePlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!imagePreview}
              className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ background: '#F3B4E3', color: '#FFFFFF' }}
            >
              {t('analyzeButton')}
            </button>
          </div>
        )}

        {/* STEP: ANALYZING */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F3B4E3', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: '#8E8E93' }}>{t('analyzing')}</p>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 'preview' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs" style={{ color: '#636366' }}>
              {t('previewIntro', { count: events.length })}
            </p>
            {events.map((e, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-3 flex flex-col gap-2"
                style={{ background: '#FFFFFF', border: '1px solid #E5E5EA' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold" style={{ color: '#8E8E93' }}>
                    #{idx + 1} ・ {t('confidence')}: {e.confidence}%
                  </span>
                  <button
                    onClick={() => removeEvent(idx)}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#DC2626' }}
                  >
                    {tCommon('delete')}
                  </button>
                </div>

                <Field label={t('fieldTitle')}>
                  <input
                    type="text"
                    value={e.event_title}
                    onChange={(ev) => updateEvent(idx, { event_title: ev.target.value })}
                    className="field-input"
                  />
                </Field>

                <Field label={t('fieldSubTitle')}>
                  <input
                    type="text"
                    value={e.sub_event_title}
                    onChange={(ev) => updateEvent(idx, { sub_event_title: ev.target.value })}
                    className="field-input"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label={t('fieldStartDate')}>
                    <input
                      type="date"
                      value={e.start_date}
                      onChange={(ev) => updateEvent(idx, { start_date: ev.target.value })}
                      className="field-input"
                    />
                  </Field>
                  <Field label={t('fieldStartTime')}>
                    <input
                      type="time"
                      value={e.start_time}
                      onChange={(ev) => updateEvent(idx, { start_time: ev.target.value })}
                      className="field-input"
                    />
                  </Field>
                </div>

                <Field label={t('fieldEndDate')}>
                  <input
                    type="date"
                    value={e.end_date ?? ''}
                    onChange={(ev) => updateEvent(idx, { end_date: ev.target.value || null })}
                    className="field-input"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label={t('fieldTag')}>
                    <select
                      value={e.tag}
                      onChange={(ev) => updateEvent(idx, { tag: ev.target.value })}
                      className="field-input"
                    >
                      {TAG_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('fieldCountry')}>
                    <select
                      value={e.country}
                      onChange={(ev) => updateEvent(idx, { country: ev.target.value })}
                      className="field-input"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c || '—'}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label={t('fieldSpot')}>
                  <input
                    type="text"
                    value={e.spot_name}
                    onChange={(ev) => updateEvent(idx, { spot_name: ev.target.value })}
                    className="field-input"
                  />
                </Field>

                <Field label={t('fieldSourceUrl')}>
                  <input
                    type="url"
                    value={e.source_url}
                    onChange={(ev) => updateEvent(idx, { source_url: ev.target.value })}
                    className="field-input"
                  />
                </Field>

                {e.notes && (
                  <Field label={t('fieldNotes')}>
                    <textarea
                      value={e.notes}
                      onChange={(ev) => updateEvent(idx, { notes: ev.target.value })}
                      rows={2}
                      className="field-input resize-none"
                    />
                  </Field>
                )}
              </div>
            ))}

            <button
              onClick={addEmptyEvent}
              className="w-full py-2.5 rounded-xl text-xs font-bold"
              style={{ background: '#FFFFFF', border: '1px dashed #C7C7CC', color: '#8E8E93' }}
            >
              + {t('addEventRow')}
            </button>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSubmit}
                disabled={events.length === 0}
                className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: '#F3B4E3', color: '#FFFFFF' }}
              >
                {t('submitButton')}
              </button>
              <button
                onClick={() => setStep('input')}
                className="w-full py-2.5 rounded-xl text-xs font-bold"
                style={{ background: '#F0F0F5', color: '#636366' }}
              >
                {t('backToInput')}
              </button>
            </div>
          </div>
        )}

        {/* STEP: SUBMITTING */}
        {step === 'submitting' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F3B4E3', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: '#8E8E93' }}>{t('submitting')}</p>
          </div>
        )}

        {/* STEP 3: DONE */}
        {step === 'done' && (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.15)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-lg font-black" style={{ color: '#1C1C1E' }}>{t('doneTitle')}</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#636366' }}>
              {t('doneMessage', { count: insertedCount })}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Link href="/schedule" className="w-full py-2.5 rounded-xl text-sm font-bold text-center" style={{ background: '#F3B4E3', color: '#FFFFFF' }}>
                {t('linkToSchedule')}
              </Link>
              <Link href="/my" className="w-full py-2.5 rounded-xl text-sm font-bold text-center" style={{ background: '#F0F0F5', color: '#636366' }}>
                {t('linkToMy')}
              </Link>
              <button
                onClick={resetAll}
                className="w-full py-2.5 rounded-xl text-xs font-bold"
                style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#636366' }}
              >
                {t('submitAnother')}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.field-input) {
          width: 100%;
          padding: 8px 10px;
          border-radius: 10px;
          background: #F8F9FA;
          border: 1px solid #E5E5EA;
          font-size: 13px;
          color: #1C1C1E;
          outline: none;
        }
        :global(.field-input:focus) {
          border-color: #F3B4E3;
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold tracking-wider" style={{ color: '#8E8E93' }}>{label}</span>
      {children}
    </label>
  )
}
