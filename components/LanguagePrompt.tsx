'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from '@/i18n/navigation'
import { useAuth } from '@/lib/supabase/useAuth'
import { createClient } from '@/lib/supabase/client'

const LANGUAGES = [
  { code: 'ja' as const, flag: '\u{1F1EF}\u{1F1F5}', label: '日本語', prompt: '言語を選択してください' },
  { code: 'en' as const, flag: '\u{1F1FA}\u{1F1F8}', label: 'English', prompt: 'Please select your language' },
  { code: 'ko' as const, flag: '\u{1F1F0}\u{1F1F7}', label: '한국어', prompt: '언어를 선택해 주세요' },
]

export default function LanguagePrompt() {
  const { user } = useAuth()
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!user) { setShow(false); return }
    let cancelled = false
    const run = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('language_selected')
        .eq('id', user.id)
        .single()
      if (cancelled) return
      const selected = Boolean(data?.language_selected)
      setShow(!selected)
    }
    void run()
    return () => { cancelled = true }
  }, [user])

  const pick = useCallback(async (code: 'ja' | 'en' | 'ko') => {
    if (!user || saving) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ language: code, language_selected: true })
      .eq('id', user.id)
    if (error) {
      setSaving(false)
      return
    }
    document.cookie = `NEXT_LOCALE=${code};path=/;max-age=31536000`
    setShow(false)
    router.replace('/', { locale: code })
  }, [user, saving, router])

  if (!mounted || !show) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.55)', zIndex: 150 }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#FFFFFF' }}
      >
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="text-3xl mb-2">🌐</div>
          {LANGUAGES.map(l => (
            <p key={l.code} className="text-xs" style={{ color: '#8E8E93' }}>
              {l.prompt}
            </p>
          ))}
        </div>
        <div className="px-4 py-4 flex flex-col gap-2">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => pick(l.code)}
              disabled={saving}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-opacity"
              style={{
                background: '#F8F9FA',
                border: '1.5px solid #E5E5EA',
                opacity: saving ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 22 }}>{l.flag}</span>
              <span className="text-sm font-bold" style={{ color: '#1C1C1E' }}>{l.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
