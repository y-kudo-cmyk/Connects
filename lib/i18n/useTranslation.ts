'use client'

import { useState, useEffect, useCallback } from 'react'
import translations, { type Locale, type TranslationKey } from './translations'

const LANG_KEY = 'cp-lang'

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>('ja')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY) as Locale | null
      if (saved && (saved === 'ja' || saved === 'en' || saved === 'ko')) {
        setLocaleState(saved)
      }
    } catch {}
  }, [])

  const setLocale = useCallback((lang: Locale) => {
    setLocaleState(lang)
    try { localStorage.setItem(LANG_KEY, lang) } catch {}
  }, [])

  const t = useCallback((key: TranslationKey): string => {
    const entry = translations[key]
    if (!entry) return key
    if (typeof entry === 'string') return entry
    return (entry as Record<Locale, string>)[locale] ?? (entry as Record<Locale, string>)['ja'] ?? key
  }, [locale])

  // For nested objects like announcementTypes, distanceLabels
  const tObj = useCallback(<T>(key: TranslationKey): T => {
    const entry = translations[key]
    if (!entry) return {} as T
    if (typeof entry === 'object' && locale in entry) {
      return (entry as Record<Locale, T>)[locale]
    }
    return (entry as Record<Locale, T>)['ja'] ?? ({} as T)
  }, [locale])

  return { t, tObj, locale, setLocale }
}

// Static helper for server components or non-hook usage
export function getTranslation(locale: Locale, key: TranslationKey): string {
  const entry = translations[key]
  if (!entry) return key
  if (typeof entry === 'string') return entry
  return (entry as Record<Locale, string>)[locale] ?? (entry as Record<Locale, string>)['ja'] ?? key
}
