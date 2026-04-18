'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { CardMaster, UserCard } from '@/lib/useCardData'
import ImageCropModal from '@/components/ImageCropModal'

const CARD_ASPECT = 2 / 3 // width / height (トレカ比率)

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bin = atob(base64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], filename, { type: mime })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const supabase = createClient()

interface CardDetailModalProps {
  card: CardMaster
  owned: UserCard | null
  userId: string
  onClose: () => void
  onSave: () => void
  onDelete: (id: string) => void
}

async function uploadImage(file: File, path: string): Promise<string> {
  // Convert to webp if possible
  const ext = 'webp'
  const fullPath = `${path}.${ext}`

  const { error } = await supabase.storage
    .from('card-images')
    .upload(fullPath, file, { contentType: 'image/webp', upsert: true })

  if (error) {
    // Fallback: try original format
    const { error: err2 } = await supabase.storage
      .from('card-images')
      .upload(`${path}.${file.name.split('.').pop()}`, file, { upsert: true })
    if (err2) throw err2
    const { data: urlData } = supabase.storage.from('card-images').getPublicUrl(`${path}.${file.name.split('.').pop()}`)
    return urlData.publicUrl
  }

  const { data: urlData } = supabase.storage.from('card-images').getPublicUrl(fullPath)
  return urlData.publicUrl
}

export default function CardDetailModal({ card, owned, userId, onClose, onSave, onDelete }: CardDetailModalProps) {
  const t = useTranslations('Goods')
  const [quantity, setQuantity] = useState(owned?.quantity ?? 1)
  const [notes, setNotes] = useState(owned?.notes ?? '')
  const [frontPreview, setFrontPreview] = useState<string>(owned?.front_image_url || card.front_image_url || '')
  const [backPreview, setBackPreview] = useState<string>(owned?.back_image_url || card.back_image_url || '')
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropSide, setCropSide] = useState<'front' | 'back' | null>(null)
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const handleImageSelect = useCallback((side: 'front' | 'back') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow reselect same file
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setCropSrc(dataUrl)
    setCropSide(side)
  }, [])

  const handleCropConfirm = useCallback((dataUrl: string) => {
    if (!cropSide) return
    const file = dataUrlToFile(dataUrl, `${cropSide}-${Date.now()}.webp`)
    if (cropSide === 'front') {
      setFrontFile(file)
      setFrontPreview(dataUrl)
    } else {
      setBackFile(file)
      setBackPreview(dataUrl)
    }
    setCropSrc(null)
    setCropSide(null)
  }, [cropSide])

  const handleCropCancel = useCallback(() => {
    setCropSrc(null)
    setCropSide(null)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setErrorMsg('')
    try {
      let frontUrl = owned?.front_image_url || card.front_image_url || ''
      let backUrl = owned?.back_image_url || card.back_image_url || ''

      if (frontFile) {
        try {
          frontUrl = await uploadImage(frontFile, `cards/${userId}/${card.id}_front_${Date.now()}`)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          throw new Error(`表面画像アップロード失敗: ${msg}`)
        }
      }
      if (backFile) {
        try {
          backUrl = await uploadImage(backFile, `cards/${userId}/${card.id}_back_${Date.now()}`)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          throw new Error(`裏面画像アップロード失敗: ${msg}`)
        }
      }

      if (owned) {
        const { error } = await supabase.from('user_cards').update({
          quantity,
          notes,
          front_image_url: frontUrl,
          back_image_url: backUrl,
        }).eq('id', owned.id)
        if (error) throw new Error(`DB更新失敗: ${error.message}`)
      } else {
        const id = `CARD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const { error } = await supabase.from('user_cards').insert({
          id,
          user_id: userId,
          card_master_id: card.id,
          product_id: card.product_id,
          version_id: card.version_id || '',
          member_id: card.member_id,
          member_name: card.member_name,
          front_image_url: frontUrl,
          back_image_url: backUrl,
          quantity,
          notes,
          status: 'ACTIVE',
        })
        if (error) throw new Error(`DB登録失敗: ${error.message}`)
      }

      onSave()
      setSaved(true)
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Save card error:', err)
      setErrorMsg(msg)
    } finally {
      setSaving(false)
    }
  }, [owned, card, userId, quantity, notes, frontFile, backFile, onSave, onClose])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', zIndex: 60 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl overflow-hidden flex flex-col relative"
        style={{ background: '#F8F9FA', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Success overlay */}
        {saved && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.95)', zIndex: 10 }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: '#F3B4E3' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-base font-black" style={{ color: '#1C1C1E' }}>
              {owned ? '更新しました' : '登録しました'}
            </p>
          </div>
        )}

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>

        <div className="overflow-y-auto px-4 flex-1">
          {/* Card info header */}
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-base font-black" style={{ color: '#1C1C1E' }}>
              {card.member_name}
            </h3>
            <span className="text-xs" style={{ color: '#8E8E93' }}>
              {card.card_detail || card.card_type}
            </span>
          </div>

          {/* Front / Back image */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Front */}
            <div>
              <label className="text-[10px] font-bold mb-1 block" style={{ color: '#636366' }}>{t('frontImage')}</label>
              <button
                onClick={() => frontRef.current?.click()}
                className="w-full aspect-[2/3] rounded-xl overflow-hidden flex items-center justify-center"
                style={{
                  background: frontPreview ? `url(${frontPreview}) center/cover` : 'rgba(243,180,227,0.1)',
                  border: '2px dashed #E5E5EA',
                }}
              >
                {!frontPreview && (
                  <div className="flex flex-col items-center gap-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="text-[9px]" style={{ color: '#C7C7CC' }}>{t('uploadPhoto')}</span>
                  </div>
                )}
              </button>
              <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect('front')} />
            </div>
            {/* Back */}
            <div>
              <label className="text-[10px] font-bold mb-1 block" style={{ color: '#636366' }}>{t('backImage')}</label>
              <button
                onClick={() => backRef.current?.click()}
                className="w-full aspect-[2/3] rounded-xl overflow-hidden flex items-center justify-center"
                style={{
                  background: backPreview ? `url(${backPreview}) center/cover` : 'rgba(243,180,227,0.1)',
                  border: '2px dashed #E5E5EA',
                }}
              >
                {!backPreview && (
                  <div className="flex flex-col items-center gap-1 px-1 text-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F3B4E3" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="text-[9px] font-semibold leading-tight" style={{ color: '#636366' }}>
                      裏面画像の投稿に<br/>ご協力ください
                    </span>
                  </div>
                )}
              </button>
              <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect('back')} />
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="text-[10px] font-bold mb-1 block" style={{ color: '#636366' }}>{t('quantity')}</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold"
                style={{ background: '#E5E5EA', color: '#636366' }}
              >
                -
              </button>
              <span className="text-lg font-black w-8 text-center" style={{ color: '#1C1C1E' }}>{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold"
                style={{ background: '#F3B4E3', color: '#FFFFFF' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="text-[10px] font-bold mb-1 block" style={{ color: '#636366' }}>{t('notes')}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5EA', color: '#1C1C1E' }}
            />
          </div>

          {/* Error message */}
          {errorMsg && (
            <div
              className="mb-4 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: 'rgba(248,113,113,0.12)', color: '#B91C1C', border: '1px solid rgba(248,113,113,0.3)' }}
            >
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* Actions (pinned to bottom) */}
        <div
          className="flex gap-3 px-4 pt-3 flex-shrink-0"
          style={{
            background: '#F8F9FA',
            borderTop: '1px solid #E5E5EA',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {owned && (
            <button
              onClick={() => { onDelete(owned.id); onClose() }}
              className="py-3 px-4 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171' }}
            >
              {t('removeCard')}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-opacity"
            style={{
              background: '#F3B4E3',
              color: '#FFFFFF',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? t('saving') : (owned ? t('updateCard') : t('addCard'))}
          </button>
        </div>
      </div>
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspectRatio={(card.card_type || '').toLowerCase() === 'photocard' ? CARD_ASPECT : 0}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>,
    document.body
  )
}
