'use client'

import { useState, useEffect } from 'react'

export type AuthUser = {
  id: string
  name: string
  email: string
  avatar?: string
  loginMethod: 'google' | 'email'
}

const AUTH_KEY = 'cp-user'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {}
    setLoading(false)
  }, [])

  const signIn = (u: AuthUser) => {
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(u)) } catch {}
    setUser(u)
  }

  const signOut = () => {
    try {
      localStorage.removeItem(AUTH_KEY)
      // Keep other user data intact (todos, entries, etc.) — just remove auth
    } catch {}
    setUser(null)
  }

  return { user, loading, signIn, signOut }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
