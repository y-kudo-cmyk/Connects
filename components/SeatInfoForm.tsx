'use client'

import { useEffect, useRef, useState } from 'react'
import { SeatField, SeatInfo } from '@/lib/useMyEntries'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { ArenaPositionPicker, detectSection } from '@/components/ArenaMap'

// 会場タイプ別のプリセットラベル（キー名は翻訳で表示）
const PRESET_LABELS: Record<string, string[]> = {
  domestic: ['スタンド/エリア', 'ブロック', '列', '座席番号', 'ゲート'],
  dome: ['エリア', 'ブロック', '列', '席番号', 'ゲート'],
  overseas: ['Section/Zone', 'Block/Area', 'Row', 'Seat No.', 'Gate'],
}
const PRESET_KEYS = { domestic: 'seatPresetDomestic', dome: 'seatPresetDome', overseas: 'seatPresetOverseas' } as const

function emptyFields(labels: string[]): SeatField[] {
  return labels.map((label) => ({ label, value: '' }))
}

async function callAnalyzeAPI(dataUrl: string): Promise<SeatField[]> {
  const [header, base64] = dataUrl.split(',')
  const mimeMatch = header.match(/:(.*?);/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  const res = await fetch('/api/analyze-ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType }),
  })
  if (!res.ok) throw new Error('failed')
  const data = await res.json()
  return data.fields ?? []
}

export default function SeatInfoForm({
  value,
  onChange,
  ticketImages,
  autoAnalyzeTrigger,  // ticketImagesが増えたときに外から呼ぶ用
}: {
  value: SeatInfo
  onChange: (v: SeatInfo) => void
  ticketImages?: string[]
  autoAnalyzeTrigger?: number  // incrementするとanalyze発火
}) {
  const { t } = useTranslation()
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [error, setError] = useState('')
  const prevTrigger = useRef(0)

  const fields = value.fields ?? []

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
      } else {
        setError(t('seatAnalyzeFailed'))
      }
    } catch {
      setError(t('seatAnalyzeFail2'))
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

  return (
    <div className="flex flex-col gap-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#3B82F6' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 9V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2"/>
            <path d="M2 9l10 6 10-6"/><path d="M12 15v6"/>
          </svg>
          {t('seatInfo')}
        </p>
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
                t('seatAnalyzed')
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {t('seatAnalyze')}
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
          <p className="text-xs" style={{ color: '#3B82F6' }}>{t('seatAnalyzing')}</p>
        </div>
      )}

      {error && (
        <p className="text-[11px] px-1" style={{ color: '#EF4444' }}>{error}</p>
      )}

      {/* プリセット */}
      <div>
        <p className="text-[11px] font-semibold mb-1.5" style={{ color: '#8E8E93' }}>{t('seatField')}</p>
        <div className="flex gap-2">
          {Object.entries(PRESET_LABELS).map(([key, labels]) => (
            <button
              key={key}
              onClick={() => applyPreset(labels)}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ background: '#F0F0F5', color: '#636366', border: '1px solid #E5E5EA' }}
            >
              {t(PRESET_KEYS[key as keyof typeof PRESET_KEYS])}
            </button>
          ))}
          <button
            onClick={() => onChange({ fields: [{ label: '', value: '' }] })}
            className="flex-1 py-2 rounded-xl text-xs font-bold"
            style={{ background: '#F0F0F5', color: '#636366', border: '1px solid #E5E5EA' }}
          >
            {t('seatCustom')}
          </button>
        </div>
      </div>

      {/* フィールドリスト */}
      {fields.length === 0 ? (
        <button
          onClick={() => applyPreset(PRESET_LABELS['domestic'])}
          className="w-full py-4 rounded-xl text-xs flex flex-col items-center gap-1"
          style={{ border: '1.5px dashed #E5E5EA', color: '#8E8E93' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t('seatTapToInput')}
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
                placeholder={t('seatFieldName')}
                className="w-24 flex-shrink-0 px-2.5 py-2 rounded-lg text-xs outline-none"
                style={{ background: '#F0F0F5', border: '1px solid #E5E5EA', color: '#636366' }}
              />
              <span style={{ color: '#C7C7CC' }}>:</span>
              {/* 値 */}
              <input
                type="text"
                value={field.value}
                onChange={(e) => setField(idx, 'value', e.target.value)}
                placeholder={t('seatFieldValue')}
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
            {t('seatAddField')}
          </button>
        </div>
      )}

      {/* 地図で位置を設定 */}
      {fields.some((f) => f.value.trim()) && (
        <PositionSection value={value} onChange={onChange} fields={fields} />
      )}
    </div>
  )
}

function PositionSection({
  value, onChange, fields,
}: {
  value: SeatInfo
  onChange: (v: SeatInfo) => void
  fields: SeatField[]
}) {
  const { t } = useTranslation()
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
          {value.position ? detectSection(value.position) || t('seatMapSet') : t('seatMapSetPosition')}
        </button>
      </div>

      {/* 地図ピッカー */}
      {open && (
        <ArenaPositionPicker
          value={value.position}
          onChange={(pos) => onChange({ ...value, position: pos })}
        />
      )}
    </div>
  )
}
