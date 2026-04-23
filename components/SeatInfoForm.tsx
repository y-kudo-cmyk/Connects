'use client'

import { useEffect, useRef, useState } from 'react'
import { SeatField, SeatInfo } from '@/lib/useMyEntries'
import { useTranslations } from 'next-intl'
import { ArenaPositionPicker, detectSection } from '@/components/ArenaMap'
import TokyoDomeSeatPicker, { type TokyoDomeSeatPick } from '@/components/TokyoDomeSeatPicker'
import { resolveVenueLayout } from '@/lib/venueLayouts'

// 会場タイプ別のプリセットラベルキー
const PRESET_LABEL_KEYS: Record<string, string[]> = {
  domestic: ['Seat.presetStandArea', 'Seat.presetBlock', 'Seat.presetRow', 'Seat.presetSeatNumber', 'Seat.presetGate'],
  dome: ['Seat.presetArea', 'Seat.presetBlock', 'Seat.presetRow', 'Seat.presetSeatNo', 'Seat.presetGate'],
  overseas: ['Seat.presetStandArea', 'Seat.presetBlock', 'Seat.presetRow', 'Seat.presetSeatNumber', 'Seat.presetGate'],
}
const PRESET_KEYS = { domestic: 'Seat.seatPresetDomestic', dome: 'Seat.seatPresetDome', overseas: 'Seat.seatPresetOverseas' } as const

function emptyFields(labels: string[]): SeatField[] {
  return labels.map((label) => ({ label, value: '' }))
}

function resolvePresetLabels(keys: string[], t: (key: string) => string): string[] {
  return keys.map((key) => t(key))
}

async function callAnalyzeAPI(imageUrl: string): Promise<SeatField[]> {
  let base64 = ''
  let mimeType = 'image/jpeg'
  if (imageUrl.startsWith('data:')) {
    // data URL 形式: data:image/jpeg;base64,xxxxx
    const [header, b64] = imageUrl.split(',')
    base64 = b64
    const mimeMatch = header.match(/:(.*?);/)
    if (mimeMatch) mimeType = mimeMatch[1]
  } else {
    // 通常のURL (Supabase公開URL等) → fetch して base64 化
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`image fetch failed: ${res.status}`)
    const blob = await res.blob()
    mimeType = blob.type || 'image/jpeg'
    const buf = await blob.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let bin = ''
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    base64 = btoa(bin)
  }
  const res = await fetch('/api/analyze-ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType }),
  })
  if (!res.ok) throw new Error('analyze failed: ' + res.status)
  const data = await res.json()
  return data.fields ?? []
}

export default function SeatInfoForm({
  value,
  onChange,
  ticketImages,
  autoAnalyzeTrigger,  // ticketImagesが増えたときに外から呼ぶ用
  isAdmin = false,
  venue,
}: {
  value: SeatInfo
  onChange: (v: SeatInfo) => void
  ticketImages?: string[]
  autoAnalyzeTrigger?: number  // incrementするとanalyze発火
  isAdmin?: boolean
  venue?: string
}) {
  const t = useTranslations()
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [error, setError] = useState('')
  const prevTrigger = useRef(0)

  const fields = value.fields ?? []

  // 編集モード state: 値があれば初期 collapsed、無ければ編集開始
  const hasValues = fields.some((f) => f.value.trim() !== '')
  const [editing, setEditing] = useState(!hasValues)

  // 自動解析後は editing 状態になる (ユーザーが確認できるように)
  // collapsed で表示する時の1行サマリ
  const summary = fields
    .filter((f) => f.value.trim() !== '')
    .map((f) => `${f.label}${f.label ? ': ' : ''}${f.value}`)
    .join(' / ')

  // autoAnalyzeTrigger が増えたら自動解析
  useEffect(() => {
    if (
      autoAnalyzeTrigger &&
      autoAnalyzeTrigger > prevTrigger.current &&
      ticketImages?.length
    ) {
      prevTrigger.current = autoAnalyzeTrigger
      doAnalyze()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalyzeTrigger])

  const doAnalyze = async () => {
    if (!ticketImages?.length) return
    setAnalyzing(true)
    setError('')
    try {
      const result = await callAnalyzeAPI(ticketImages[ticketImages.length - 1])
      if (result.length > 0) {
        onChange({ fields: result })
        setAnalyzed(true)
        setEditing(true) // 解析結果確認のため編集モード
      } else {
        setError(t('Seat.seatAnalyzeFailed'))
      }
    } catch {
      setError(t('Seat.seatAnalyzeFail2'))
    } finally {
      setAnalyzing(false)
    }
  }

  const setField = (idx: number, key: 'label' | 'value', val: string) => {
    const next = [...fields]
    next[idx] = { ...next[idx], [key]: val }
    onChange({ fields: next })
  }

  const addField = () => {
    onChange({ fields: [...fields, { label: '', value: '' }] })
  }

  const removeField = (idx: number) => {
    onChange({ fields: fields.filter((_, i) => i !== idx) })
  }

  const applyPreset = (labels: string[]) => {
    // 既存の値をできるだけ引き継ぐ
    const next: SeatField[] = labels.map((label, i) => ({
      label,
      value: fields[i]?.value ?? '',
    }))
    onChange({ fields: next })
  }

  // 確定済み (collapsed) 表示: 1行サマリ + タップで再編集
  if (!editing && hasValues) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" className="flex-shrink-0">
          <path d="M20 9V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2"/>
          <path d="M2 9l10 6 10-6"/><path d="M12 15v6"/>
        </svg>
        <span className="text-sm font-bold flex-1 min-w-0 truncate" style={{ color: '#1C1C1E' }}>
          {summary}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" className="flex-shrink-0">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ヘッダー (座席情報タイトルは冗長なので削除、解析ボタンのみ) */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          {ticketImages && ticketImages.length > 0 && (
            <button
              onClick={doAnalyze}
              disabled={analyzing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold"
              style={
                analyzed
                  ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' }
                  : { background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }
              }
            >
              {analyzing ? (
                <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
              ) : analyzed ? (
                t('Seat.seatAnalyzed')
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {t('Seat.seatAnalyze')}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 解析中オーバーレイ */}
      {analyzing && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full flex-shrink-0" />
          <p className="text-xs" style={{ color: '#3B82F6' }}>{t('Seat.seatAnalyzing')}</p>
        </div>
      )}

      {error && (
        <p className="text-[11px] px-1" style={{ color: '#EF4444' }}>{error}</p>
      )}

      {/* フィールドリスト */}
      {fields.length === 0 ? (
        <button
          onClick={() => applyPreset(resolvePresetLabels(PRESET_LABEL_KEYS['domestic'], t))}
          className="w-full py-4 rounded-xl text-xs flex flex-col items-center gap-1"
          style={{ border: '1.5px dashed #E5E5EA', color: '#8E8E93' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t('Seat.seatTapToInput')}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {/* ラベル */}
              <input
                type="text"
                value={field.label}
                onChange={(e) => setField(idx, 'label', e.target.value)}
                placeholder={t('Seat.seatFieldName')}
                className="w-24 flex-shrink-0 px-2.5 py-2 rounded-lg text-xs outline-none"
                style={{ background: '#F0F0F5', border: '1px solid #E5E5EA', color: '#636366' }}
              />
              <span style={{ color: '#C7C7CC' }}>:</span>
              {/* 値 */}
              <input
                type="text"
                value={field.value}
                onChange={(e) => setField(idx, 'value', e.target.value)}
                placeholder={t('Seat.seatFieldValue')}
                className="flex-1 px-2.5 py-2 rounded-lg text-sm font-semibold outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
              />
              {/* 削除 */}
              <button
                onClick={() => removeField(idx)}
                className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-lg"
                style={{ background: '#F0F0F5' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
          {/* 追加ボタン */}
          <button
            onClick={addField}
            className="flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold"
            style={{ background: '#F0F0F5', color: '#636366', border: '1px dashed #C7C7CC' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t('Seat.seatAddField')}
          </button>
        </div>
      )}

      {/* 地図で位置を設定
          - 東京ドーム: 精密版 TokyoDomeSeatPicker (全員開放)
          - それ以外: 既存 ArenaPositionPicker (admin 限定) */}
      {isTokyoDomeVenue(venue) ? (
        fields.some((f) => f.value.trim()) && (
          <TokyoDomePositionSection value={value} onChange={onChange} fields={fields} />
        )
      ) : (
        isAdmin && fields.some((f) => f.value.trim()) && (
          <PositionSection value={value} onChange={onChange} fields={fields} venue={venue} />
        )
      )}

      {/* 確定ボタン: 入力値がある時のみ表示、押すと 1行サマリ表示にcollapsed */}
      {hasValues && (
        <button
          onClick={() => setEditing(false)}
          className="w-full py-3 rounded-xl text-sm font-bold"
          style={{ background: '#F3B4E3', color: '#FFFFFF' }}
        >
          {t('Common.confirm')}
        </button>
      )}
    </div>
  )
}

/** venue が東京ドームか判定 */
function isTokyoDomeVenue(venue?: string): boolean {
  if (!venue) return false
  const layout = resolveVenueLayout(venue)
  return layout?.id === 'tokyoDome'
}

function TokyoDomePositionSection({
  value, onChange, fields,
}: {
  value: SeatInfo
  onChange: (v: SeatInfo) => void
  fields: SeatField[]
}) {
  const [open, setOpen] = useState(false)

  // 既存 fields から ブロック/列/席番を推測 (プリセット: エリア/ブロック/列/席番)
  const guessBlock = (fields[1]?.value || fields[0]?.value || '').trim().toUpperCase()
  const guessRow = Number((fields[2]?.value || '').replace(/[^0-9]/g, '')) || undefined
  const guessSeat = Number((fields[3]?.value || '').replace(/[^0-9]/g, '')) || undefined

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 9V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2"/>
            <path d="M2 9l10 6 10-6"/><path d="M12 15v6"/>
          </svg>
          <span className="truncate">
            {fields.filter((f) => f.value.trim()).map((f) => f.value).join(' / ')}
          </span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-bold flex-shrink-0"
          style={
            value.position
              ? { background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }
              : { background: '#F0F0F5', color: '#636366', border: '1px solid #E5E5EA' }
          }
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {value.position ? '地図設定済 (東京ドーム)' : '東京ドームで位置を設定'}
        </button>
      </div>

      {open && (
        <TokyoDomeSeatPicker
          initial={{ blockId: guessBlock, row: guessRow, seat: guessSeat }}
          onChange={(pick: TokyoDomeSeatPick | null) => {
            if (pick) {
              onChange({ ...value, position: { x: pick.position.x, y: pick.position.y } })
            } else {
              onChange({ ...value, position: undefined })
            }
          }}
        />
      )}
    </div>
  )
}

function PositionSection({
  value, onChange, fields, venue,
}: {
  value: SeatInfo
  onChange: (v: SeatInfo) => void
  fields: SeatField[]
  venue?: string
}) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      {/* サマリ + 地図ボタン */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 9V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2"/>
            <path d="M2 9l10 6 10-6"/><path d="M12 15v6"/>
          </svg>
          <span className="truncate">{fields.filter((f) => f.value.trim()).map((f) => f.value).join(' / ')}</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-bold flex-shrink-0"
          style={
            value.position
              ? { background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }
              : { background: '#F0F0F5', color: '#636366', border: '1px solid #E5E5EA' }
          }
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {value.position ? detectSection(value.position, venue) || t('Seat.seatMapSet') : t('Seat.seatMapSetPosition')}
        </button>
      </div>

      {/* 地図ピッカー */}
      {open && (
        <ArenaPositionPicker
          value={value.position}
          onChange={(pos) => onChange({ ...value, position: pos })}
          venueName={venue}
        />
      )}
    </div>
  )
}
