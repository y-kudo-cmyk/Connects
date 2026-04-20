'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/supabase/useAuth'

const supabase = createClient()

export type FanClubMembership = {
  id: string
  clubName: string
  memberNumber: string
  memberPassword?: string
  mobileMemberNumber?: string
  mobilePassword?: string
  email?: string
  phone?: string
  validUntil?: string
  note?: string
}

export type ProfileStats = {
  posts: number
  approvals: number
  edits: number
  referrals: number
}

export type NotifSettings = {
  morningOn: boolean
  morningTime: string
  eveningOn: boolean
  eveningTime: string
  myEventReminder: boolean
}

export type ProfileData = {
  membershipNumber: string
  nickname: string
  bio: string
  bannerImage: string
  avatarImage: string
  language: 'ja' | 'en' | 'ko'
  country: string
  lineLinked: boolean
  xLinked: boolean
  role: 'user' | 'admin' | string
  notif: NotifSettings
  fanClubs: FanClubMembership[]
  stats: ProfileStats
}

const DEFAULT: ProfileData = {
  membershipNumber: '',
  nickname: '',
  bio: '',
  bannerImage: '',
  avatarImage: '',
  language: 'ja',
  country: 'JP',
  lineLinked: false,
  xLinked: false,
  role: 'user',
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
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData>(DEFAULT)

  const fetchProfile = useCallback(async () => {
    if (!user) return
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (!p) return

    const { data: fcs } = await supabase
      .from('fan_club_memberships')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    // 実際の投稿数・承認数・編集数をリアルタイムカウント
    const [
      { count: spotCount }, { count: photoCount }, { count: eventCount }, { count: urlCount },
      { count: eventVoteCount }, { count: photoVoteCount },
      { count: editReqCount }, { count: activityEditCount },
    ] = await Promise.all([
      supabase.from('spots').select('*', { count: 'exact', head: true }).eq('submitted_by', user.id),
      supabase.from('spot_photos').select('*', { count: 'exact', head: true }).eq('submitted_by', user.id),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('submitted_by', user.id),
      supabase.from('url_submissions').select('*', { count: 'exact', head: true }).eq('submitted_by', user.id),
      supabase.from('event_votes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('spot_photo_votes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('edit_requests').select('*', { count: 'exact', head: true }).eq('submitted_by', user.id),
      supabase.from('user_activity').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('action', 'edit'),
    ])

    setProfile({
      membershipNumber: p.membership_number ?? '',
      nickname: p.nickname ?? '',
      bio: '',
      bannerImage: p.banner_url ?? '',
      avatarImage: p.avatar_url ?? '',
      language: (p.language ?? 'ja') as 'ja' | 'en' | 'ko',
      country: p.country ?? 'JP',
      lineLinked: !!p.line_user_id,
      xLinked: false,
      role: p.role ?? 'user',
      notif: {
        morningOn: p.notif_morning_on ?? false,
        morningTime: p.notif_morning_time ?? '08:00',
        eveningOn: p.notif_evening_on ?? false,
        eveningTime: p.notif_evening_time ?? '21:00',
        myEventReminder: p.notif_event_reminder ?? true,
      },
      fanClubs: (fcs ?? []).map((fc) => ({
        id: fc.id,
        clubName: fc.club_name ?? '',
        memberNumber: fc.member_number ?? '',
        memberPassword: fc.member_password ?? undefined,
        mobileMemberNumber: fc.mobile_number ?? undefined,
        mobilePassword: fc.mobile_password ?? undefined,
        email: fc.email ?? undefined,
        phone: fc.phone ?? undefined,
        validUntil: fc.valid_until ?? undefined,
        note: fc.note ?? undefined,
      })),
      stats: {
        posts: (spotCount ?? 0) + (photoCount ?? 0) + (eventCount ?? 0) + (urlCount ?? 0),
        approvals: (eventVoteCount ?? 0) + (photoVoteCount ?? 0),
        edits: (editReqCount ?? 0) + (activityEditCount ?? 0),
        referrals: 0,
      },
    })
  }, [user])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const update = useCallback(async (updates: Partial<ProfileData>) => {
    if (!user) return
    const dbUpdates: Record<string, unknown> = {}
    if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname
    if (updates.avatarImage !== undefined) dbUpdates.avatar_url = updates.avatarImage
    if (updates.bannerImage !== undefined) dbUpdates.banner_url = updates.bannerImage
    if (updates.language !== undefined) dbUpdates.language = updates.language
    if (updates.country !== undefined) dbUpdates.country = updates.country
    if (updates.notif !== undefined) {
      dbUpdates.notif_morning_on = updates.notif.morningOn
      dbUpdates.notif_morning_time = updates.notif.morningTime
      dbUpdates.notif_evening_on = updates.notif.eveningOn
      dbUpdates.notif_evening_time = updates.notif.eveningTime
      dbUpdates.notif_event_reminder = updates.notif.myEventReminder
    }
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('profiles').update(dbUpdates).eq('id', user.id)
    }
    await fetchProfile()
  }, [user, fetchProfile])

  const save = async (next: ProfileData) => {
    await update(next)
  }

  const addFanClub = useCallback(async (fc: FanClubMembership) => {
    if (!user) return
    await supabase.from('fan_club_memberships').insert({
      user_id: user.id,
      club_name: fc.clubName,
      member_number: fc.memberNumber,
      member_password: fc.memberPassword || null,
      mobile_number: fc.mobileMemberNumber || null,
      mobile_password: fc.mobilePassword || null,
      email: fc.email || null,
      phone: fc.phone || null,
      valid_until: fc.validUntil || null,
      note: fc.note || null,
    })
    await fetchProfile()
  }, [user, fetchProfile])

  const updateFanClub = useCallback(async (id: string, updates: Partial<FanClubMembership>) => {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.clubName !== undefined) dbUpdates.club_name = updates.clubName
    if (updates.memberNumber !== undefined) dbUpdates.member_number = updates.memberNumber
    if (updates.memberPassword !== undefined) dbUpdates.member_password = updates.memberPassword || null
    if (updates.mobileMemberNumber !== undefined) dbUpdates.mobile_number = updates.mobileMemberNumber || null
    if (updates.mobilePassword !== undefined) dbUpdates.mobile_password = updates.mobilePassword || null
    if (updates.email !== undefined) dbUpdates.email = updates.email || null
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null
    if (updates.validUntil !== undefined) dbUpdates.valid_until = updates.validUntil || null
    if (updates.note !== undefined) dbUpdates.note = updates.note || null
    await supabase.from('fan_club_memberships').update(dbUpdates).eq('id', id)
    await fetchProfile()
  }, [fetchProfile])

  const removeFanClub = useCallback(async (id: string) => {
    await supabase.from('fan_club_memberships').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    await fetchProfile()
  }, [fetchProfile])

  const incrementStat = useCallback(async (key: keyof ProfileStats) => {
    if (!user) return
    const colMap: Record<keyof ProfileStats, string> = {
      posts: 'post_count',
      approvals: 'approval_total',
      edits: 'edit_report_count',
      referrals: 'ref_code',
    }
    const col = colMap[key]
    if (col === 'ref_code') return
    const { data } = await supabase.from('profiles').select(col).eq('id', user.id).maybeSingle()
    if (data) {
      const current = (data as unknown as Record<string, number>)[col] ?? 0
      await supabase.from('profiles').update({ [col]: current + 1 }).eq('id', user.id)
    }
    await fetchProfile()
  }, [user, fetchProfile])

  return { profile, update, save, addFanClub, updateFanClub, removeFanClub, incrementStat }
}
