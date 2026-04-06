'use client'

import { useRef, useState } from 'react'
import { SeatInfo } from '@/lib/useMyEntries'
import {
  SeatView, useSeatViews, matchSeatViews, formatSeatInfo, formatSeatFields,
  arenaDistance, distanceToColor, distanceToLabel, ArenaPosition,
} from '@/lib/useSeatViews'
import { compressImage } from '@/lib/useMyEntries'
import ArenaMap, { ArenaPositionPicker, detectSection } from '@/components/ArenaMap'
import { useTranslation } from '@/lib/i18n/useTranslation'

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="9" height="9" viewBox="0 0 24 24"
          fill={i < value ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  )
}

// ─── 投稿モーダル ─────────────────────────────────────────
function UploadModal({
  seatInfo, venue, eventName, eventDate, onClose, onSaved,
}: {
  seatInfo: SeatInfo; venue?: string; eventName: string; eventDate: string
  onClose: () => void; onSaved: () => void
}) {
  const { t } = useTranslation()
  const { addView } = useSeatViews()
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [position, setPosition] = useState<ArenaPosition | undefined>(seatInfo.position)
  const [binocularsNeeded, setBinocularsNeeded] = useState(false)
  const [distanceRating, setDistanceRating] = useState<1|2|3|4|5>(3)
  const [visibilityRating, setVisibilityRating] = useState<1|2|3|4|5>(3)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleFile = async (files: FileList | null) => {
    if (!files?.[0]) return
    setImageUrl(await compressImage(files[0], 1200, 0.85))
  }

  const handleSave = () => {
    if (!imageUrl) return
    setSaving(true)
    const venueKeywords = venue ? [venue.toLowerCase().split(/[\s　]/)[0]] : []
    addView({
      id: Date.now().toString(),
      venueKeywords,
      eventName,
      eventDate,
      seatFields: seatInfo.fields ?? [],
      position,
      imageUrl,
      binocularsNeeded,
      distanceRating,
      visibilityRating,
      note: note || undefined,
      contributor: '__self__',
      createdAt: new Date().toISOString(),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  const { tObj } = useTranslation()
  const distLabels = tObj<string[]>('distanceLabels')
  const visLabels = tObj<string[]>('visibilityLabels')
  const DISTANCE_LABELS = ['', ...distLabels]
  const VISIBILITY_LABELS = ['', ...visLabels]

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      <div className="relative flex flex-col rounded-t-2xl overflow-hidden" style={{ background: '#FFFFFF', maxHeight: '92vh' }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>
        <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #E5E5EA' }}>
          <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{t('seatViewTitle')}</p>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* 写真 */}
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: '#636366' }}>{t('seatViewDesc')}</p>
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl flex flex-col items-center justify-center gap-2"
                style={{ border: '2px dashed #E5E5EA', color: '#8E8E93', aspectRatio: '4/3' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="text-sm">{t('seatViewSelect')}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleFile(e.target.files)} />
          </div>

          {/* アリーナ図でPIN設定 */}
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: '#636366' }}>
              {t('seatViewPosition')}
              <span className="ml-1 font-normal" style={{ color: '#8E8E93' }}>（{t('seatViewPositionSub')}）</span>
            </p>
            <ArenaPositionPicker value={position} onChange={setPosition} />
          </div>

          {/* 双眼鏡 */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: '#636366' }}>{t('seatViewBinoculars')}</p>
            <div className="flex gap-2">
              {[false, true].map((v) => (
                <button key={String(v)} onClick={() => setBinocularsNeeded(v)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={binocularsNeeded === v
                    ? { background: '#3B82F6', color: '#FFFFFF' }
                    : { background: '#F0F0F5', color: '#636366' }}>
                  {v ? t('seatViewNeeded') : t('seatViewNotNeeded')}
                </button>
              ))}
            </div>
          </div>

          {/* 評価 */}
          {[
            { label: t('seatViewDistance'), hints: DISTANCE_LABELS, val: distanceRating, setter: setDistanceRating, color: '#3B82F6' },
            { label: t('seatViewVisibility'), hints: VISIBILITY_LABELS, val: visibilityRating, setter: setVisibilityRating, color: '#F3B4E3' },
          ].map(({ label, hints, val, setter, color }) => (
            <div key={label}>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#636366' }}>
                {label}
                <span className="ml-2 font-normal text-[11px]" style={{ color: '#8E8E93' }}>{hints[val]}</span>
              </p>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map((v) => (
                  <button key={v} onClick={() => setter(v)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold"
                    style={val === v ? { background: color, color: '#FFFFFF' } : { background: '#F0F0F5', color: '#636366' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: '#636366' }}>{t('seatViewMemoLabel')}</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              placeholder={t('seatViewMemo')}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#F0F0F5', border: '1px solid #E5E5EA', color: '#1C1C1E' }} />
          </div>
        </div>

        <div className="px-4 py-3" style={{ borderTop: '1px solid #E5E5EA', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <button onClick={handleSave} disabled={!imageUrl || saving}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: imageUrl ? '#3B82F6' : '#E5E5EA', color: imageUrl ? '#FFFFFF' : '#8E8E93' }}>
            {saving ? t('saving') : t('seatViewSubmit')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── メインコンポーネント ─────────────────────────────────
export default function SeatViewPreview({
  seatInfo, venue, eventName, eventDate,
}: {
  seatInfo: SeatInfo; venue?: string; eventName: string; eventDate: string
}) {
  const { t } = useTranslation()
  const { views, removeView } = useSeatViews()
  const [showUpload, setShowUpload] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedView, setSelectedView] = useState<SeatView | null>(null)

  const hasFields = (seatInfo.fields?.length ?? 0) > 0 && seatInfo.fields.some((f) => f.value.trim())
  const matched = hasFields ? matchSeatViews(views, venue, seatInfo) : []
  const myPos = seatInfo.position
  const withPos = matched.filter((v) => v.position)
  const withoutPos = matched.filter((v) => !v.position)

  if (!hasFields) return null

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#636366' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {t('seatViewFromHere')}
            {matched.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                {matched.length}{t('countSuffix')}
              </span>
            )}
          </p>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t('post')}
          </button>
        </div>

        {saved && (
          <div className="px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399' }}>
            {t('posted')}
          </div>
        )}

        {matched.length === 0 ? (
          /* 空ステート */
          <button onClick={() => setShowUpload(true)}
            className="w-full py-6 rounded-xl flex flex-col items-center gap-2"
            style={{ border: '2px dashed #E5E5EA' }}>
            <span className="text-2xl">👁</span>
            <p className="text-xs font-semibold" style={{ color: '#636366' }}>{t('noPostsYet')}</p>
            <p className="text-[11px]" style={{ color: '#8E8E93' }}>{t('noPostsHint')}</p>
          </button>
        ) : (
          <>
            {/* アリーナMAP */}
            <ArenaMap
              myPosition={myPos}
              views={matched}
              onPinTap={(v) => setSelectedView(v === selectedView ? null : v)}
            />

            {/* 選択中の写真 */}
            {selectedView && (
              <SeatViewCard
                view={selectedView}
                myPosition={myPos}
                onRemove={() => { removeView(selectedView.id); setSelectedView(null) }}
              />
            )}

            {/* 位置情報なし の投稿を横スクロール */}
            {withoutPos.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {withoutPos.map((v) => (
                  <SeatViewCard key={v.id} view={v} myPosition={myPos}
                    compact onRemove={() => removeView(v.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showUpload && (
        <UploadModal seatInfo={seatInfo} venue={venue} eventName={eventName} eventDate={eventDate}
          onClose={() => setShowUpload(false)} onSaved={() => setSaved(true)} />
      )}
    </>
  )
}

// ─── 写真カード ───────────────────────────────────────────
function SeatViewCard({
  view, myPosition, onRemove, compact = false,
}: {
  view: SeatView; myPosition?: ArenaPosition; onRemove: () => void; compact?: boolean
}) {
  const { t } = useTranslation()
  const dist = myPosition && view.position ? arenaDistance(view.position, myPosition) : undefined
  const distColor = dist !== undefined ? distanceToColor(dist) : '#C7C7CC'
  const distLabel = dist !== undefined ? distanceToLabel(dist) : null
  const seatText = formatSeatFields(view.seatFields)

  if (compact) {
    return (
      <div className="flex-shrink-0 rounded-xl overflow-hidden flex flex-col"
        style={{ width: 140, border: '1px solid #E5E5EA', background: '#FFFFFF' }}>
        <div className="relative" style={{ aspectRatio: '4/3' }}>
          {view.imageUrl
            ? <img src={view.imageUrl} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
            : <div className="w-full h-full flex items-center justify-center text-xl" style={{ background: '#F0F0F5' }}>👁</div>
          }
        </div>
        <div className="p-1.5">
          {seatText && <p className="text-[10px] font-bold truncate" style={{ color: '#1C1C1E' }}>{seatText}</p>}
          <p className="text-[10px]" style={{ color: '#C7C7CC' }}>{view.eventDate}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E5EA' }}>
      {/* 写真 */}
      <div className="relative" style={{ aspectRatio: '4/3' }}>
        {view.imageUrl
          ? <img src={view.imageUrl} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
          : <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: '#F0F0F5' }}>👁</div>
        }
        {/* 双眼鏡バッジ */}
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: view.binocularsNeeded ? 'rgba(245,158,11,0.9)' : 'rgba(52,211,153,0.9)',
            color: '#FFFFFF',
          }}>
          {view.binocularsNeeded ? t('seatViewBinoYes') : t('seatViewBinoNo')}
        </span>
        {/* 距離バッジ */}
        {distLabel && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: distColor, color: dist! < 0.22 ? '#1C1C1E' : '#FFFFFF' }}>
            {distLabel}
          </span>
        )}
        {/* 削除 */}
        {view.contributor === '__self__' && (
          <button onClick={onRemove}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* 情報 */}
      <div className="p-3 flex flex-col gap-1.5">
        {seatText && (
          <p className="text-xs font-bold" style={{ color: '#1C1C1E' }}>🪑 {seatText}</p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[11px]" style={{ color: '#8E8E93' }}>{t('seatViewDistance')}</span>
            <StarRating value={view.distanceRating} />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px]" style={{ color: '#8E8E93' }}>{t('seatViewVisibility')}</span>
            <StarRating value={view.visibilityRating} />
          </div>
        </div>
        {view.note && (
          <p className="text-xs leading-snug" style={{ color: '#636366' }}>{view.note}</p>
        )}
        <p className="text-[10px]" style={{ color: '#C7C7CC' }}>
          {view.eventDate} · {view.contributor === '__self__' ? t('arenaYou') : (view.contributor ?? t('anonymous'))}
        </p>
      </div>
    </div>
  )
}
