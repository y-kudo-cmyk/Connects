'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { CardMaster, UserCard } from '@/lib/useCardData'

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
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = useCallback((side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    if (side === 'front') {
      setFrontFile(file)
      setFrontPreview(url)
    } else {
      setBackFile(file)
      setBackPreview(url)
    }
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      let frontUrl = owned?.front_image_url || card.front_image_url || ''
      let backUrl = owned?.back_image_url || card.back_image_url || ''

      if (frontFile) {
        frontUrl = await uploadImage(frontFile, `cards/${userId}/${card.id}_front_${Date.now()}`)
      }
      if (backFile) {
        backUrl = await uploadImage(backFile, `cards/${userId}/${card.id}_back_${Date.now()}`)
      }

      if (owned) {
        // Update existing
        const { error } = await supabase.from('user_cards').update({
          quantity,
          notes,
          front_image_url: frontUrl,
          back_image_url: backUrl,
        }).eq('id', owned.id)
        if (error) throw error
      } else {
        // Create new
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
        if (error) throw error
      }

      onSave()
      onClose()
    } catch (err) {
      console.error('Save card error:', err)
    } finally {
      setSaving(false)
    }
  }, [owned, card, userId, quantity, notes, frontFile, backFile, onSave, onClose])

  return (
    <div
      className="fixed inset-0 z-60 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl overflow-hidden"
        style={{ background: '#F8F9FA', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: '#C7C7CC' }} />
        </div>

        <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(90vh - 40px)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
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
          <div className="mb-5">
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

          {/* Actions */}
          <div className="flex gap-3">
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
      </div>
    </div>
  )
}
