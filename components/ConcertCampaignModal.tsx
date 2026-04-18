'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/supabase/useAuth'
import { useRouter } from '@/i18n/navigation'

const supabase = createClient()

type Props = {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

export default function ConcertCampaignModal({ open, onClose, onComplete }: Props) {
  const t = useTranslations('Campaign')
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<'intro' | 'loading' | 'done'>('intro')
  const [registeredCount, setRegisteredCount] = useState(0)

  if (!open) return null

  const handleJoin = async () => {
    if (!user) return
    setStep('loading')

    try {
      // 1. Get past domestic LIVE events
      const today = new Date().toISOString().slice(0, 10)
      const { data: events } = await supabase
        .from('events')
        .select('id, event_title, sub_event_title, tag, start_date, end_date, spot_name, spot_address, image_url, source_url')
        .eq('tag', 'LIVE')
        .eq('country', 'JP')
        .lt('start_date', today)

      if (!events || events.length === 0) {
        setStep('done')
        setRegisteredCount(0)
        return
      }

      // 2. Get already registered event_ids
      const { data: existing } = await supabase
        .from('my_entries')
        .select('event_id')
        .eq('user_id', user.id)

      const existingIds = new Set((existing ?? []).map((e: { event_id: string | null }) => e.event_id))

      // 3. Filter out already registered events
      const toInsert = events
        .filter((ev) => !existingIds.has(ev.id))
        .map((ev) => ({
          user_id: user.id,
          event_id: ev.id,
          tag: ev.tag,
          event_title: ev.event_title,
          sub_event_title: ev.sub_event_title || null,
          start_date: ev.start_date,
          end_date: ev.end_date || null,
          spot_name: ev.spot_name || null,
          spot_address: ev.spot_address || null,
          image_url: ev.image_url || null,
          source_url: ev.source_url || null,
        }))

      if (toInsert.length > 0) {
        await supabase.from('my_entries').insert(toInsert)
      }

      // Log activity
      supabase.from('user_activity').insert({
        user_id: user.id,
        action: 'campaign_concert_join',
        detail: `Registered ${toInsert.length} past LIVE events`,
      }).then(() => {})

      setRegisteredCount(toInsert.length)
      setStep('done')
    } catch {
      setStep('done')
      setRegisteredCount(0)
    }
  }

  const handleConfirm = () => {
    onComplete()
    onClose()
    setStep('intro')
    router.push('/profile')
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget && step !== 'loading') onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl overflow-y-auto"
        style={{
          background: '#FFFFFF',
          maxHeight: '90vh',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Header with gradient */}
        <div
          className="relative px-6 pt-8 pb-6 text-center"
          style={{
            background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #F97316 100%)',
          }}
        >
          {/* Close button */}
          {step !== 'loading' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          <div className="text-4xl mb-3">📸</div>
          <h2 className="text-lg font-black text-white leading-snug">
            {t('modalTitle')}
          </h2>
          <p className="text-sm text-white/80 mt-1">
            {t('modalSubtitle')}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pt-6 pb-4">
          {step === 'intro' && (
            <>
              <div className="space-y-4">
                {/* Step cards */}
                <StepCard
                  number={1}
                  icon="🎵"
                  title={t('step1Title')}
                  desc={t('step1Desc')}
                />
                <StepCard
                  number={2}
                  icon="🎫"
                  title={t('step2Title')}
                  desc={t('step2Desc')}
                />
                <StepCard
                  number={3}
                  icon="📷"
                  title={t('step3Title')}
                  desc={t('step3Desc')}
                />
              </div>

              <p className="text-[11px] mt-4 text-center" style={{ color: '#8E8E93' }}>
                {t('noteAfterJoin')}
              </p>

              <button
                onClick={handleJoin}
                className="w-full mt-5 py-3.5 rounded-xl text-white font-bold text-base"
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
                }}
              >
                {t('joinButton')}
              </button>
            </>
          )}

          {step === 'loading' && (
            <div className="py-12 text-center">
              <div className="text-4xl mb-4 animate-bounce">🎵</div>
              <p className="text-sm font-bold" style={{ color: '#1C1C1E' }}>
                {t('registering')}
              </p>
              <p className="text-xs mt-1" style={{ color: '#8E8E93' }}>
                {t('pleaseWait')}
              </p>
            </div>
          )}

          {step === 'done' && (
            <div className="py-8 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-base font-black" style={{ color: '#1C1C1E' }}>
                {t('doneTitle')}
              </p>
              {registeredCount > 0 ? (
                <p className="text-sm mt-2" style={{ color: '#636366' }}>
                  {t('doneCount', { count: registeredCount })}
                </p>
              ) : (
                <p className="text-sm mt-2" style={{ color: '#636366' }}>
                  {t('alreadyRegistered')}
                </p>
              )}
              <p className="text-xs mt-3 px-4" style={{ color: '#8E8E93' }}>
                {t('doneHint')}
              </p>

              <button
                onClick={handleConfirm}
                className="w-full mt-6 py-3.5 rounded-xl text-white font-bold text-base"
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
                }}
              >
                {t('confirmButton')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function StepCard({ number, icon, title, desc }: { number: number; icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
        style={{ background: 'rgba(168,85,247,0.1)', color: '#A855F7', fontWeight: 800 }}
      >
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span>{icon}</span>
          <span className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{title}</span>
        </div>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#636366' }}>{desc}</p>
      </div>
    </div>
  )
}
