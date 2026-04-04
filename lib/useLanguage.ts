'use client'

import { useState, useEffect } from 'react'

export type Lang = 'ja' | 'en' | 'ko'

const LANG_KEY = 'cp-lang'
const VALID: Lang[] = ['ja', 'en', 'ko']

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>('ja')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LANG_KEY) as Lang
      if (VALID.includes(raw)) setLangState(raw)
    } catch {}
  }, [])

  const setLang = (l: Lang) => {
    try { localStorage.setItem(LANG_KEY, l) } catch {}
    setLangState(l)
  }

  return { lang, setLang }
}

export function getStoredLang(): Lang {
  if (typeof window === 'undefined') return 'ja'
  try {
    const raw = localStorage.getItem(LANG_KEY) as Lang
    return VALID.includes(raw) ? raw : 'ja'
  } catch {
    return 'ja'
  }
}
