'use client'

import { useMemo } from 'react'
import { useProfile } from '@/lib/useProfile'
import { getTodayForCountry } from '@/lib/date'

/** ユーザーの居住国タイムゾーンに基づく今日の日付 (YYYY-MM-DD) */
export function useToday(): string {
  const { profile } = useProfile()
  return useMemo(() => getTodayForCountry(profile.country), [profile.country])
}
