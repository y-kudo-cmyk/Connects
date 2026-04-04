'use client'

import { useState, useEffect, useCallback } from 'react'

export type FanClubMembership = {
  id: string
  clubName: string            // 例: CARAT, Weverse CARAT
  memberNumber: string        // 会員番号
  memberPassword?: string     // 会員番号のパスワード
  mobileMemberNumber?: string // モバイル会員番号
  mobilePassword?: string     // モバイル会員番号のパスワード
  email?: string              // 登録メールアドレス
  phone?: string              // 電話番号
  validUntil?: string         // YYYY-MM-DD
  note?: string
}

export type ProfileStats = {
  posts: number       // 投稿数
  approvals: number   // 承認数
  edits: number       // 編集数
  referrals: number   // 紹介人数
}

export type NotifSettings = {
  morningOn: boolean
  morningTime: string   // 'HH:MM'
  eveningOn: boolean
  eveningTime: string   // 'HH:MM'
  myEventReminder: boolean  // 開始1時間前
}

export type ProfileData = {
  nickname: string
  bio: string
  bannerImage: string
  avatarImage: string
  language: 'ja' | 'en' | 'ko'
  country: string       // ISO 2文字コード 例: 'JP'
  lineLinked: boolean
  xLinked: boolean
  notif: NotifSettings
  fanClubs: FanClubMembership[]
  stats: ProfileStats
}

const KEY = 'cp-profile'

const DEFAULT: ProfileData = {
  nickname: 'カラット太郎',
  bio: '',
  bannerImage: '',
  avatarImage: '',
  language: 'ja',
  country: 'JP',
  lineLinked: false,
  xLinked: false,
  notif: {
    morningOn: false,
    morningTime: '08:00',
    eveningOn: false,
    eveningTime: '21:00',
    myEventReminder: true,
  },
  fanClubs: [],
  stats: { posts: 0, approvals: 0, edits: 0, referrals: 0 },
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setProfile({ ...DEFAULT, ...JSON.parse(raw) })
    } catch {}
  }, [])

  const save = (next: ProfileData) => {
    setProfile(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  }

  const update = useCallback((updates: Partial<ProfileData>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const addFanClub = useCallback((fc: FanClubMembership) => {
    setProfile((prev) => {
      const next = { ...prev, fanClubs: [...prev.fanClubs, fc] }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const updateFanClub = useCallback((id: string, updates: Partial<FanClubMembership>) => {
    setProfile((prev) => {
      const next = { ...prev, fanClubs: prev.fanClubs.map((fc) => fc.id === id ? { ...fc, ...updates } : fc) }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const removeFanClub = useCallback((id: string) => {
    setProfile((prev) => {
      const next = { ...prev, fanClubs: prev.fanClubs.filter((fc) => fc.id !== id) }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const incrementStat = useCallback((key: keyof ProfileStats) => {
    setProfile((prev) => {
      const next = { ...prev, stats: { ...prev.stats, [key]: prev.stats[key] + 1 } }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { profile, update, save, addFanClub, updateFanClub, removeFanClub, incrementStat }
}
