'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/supabase/useAuth'

const supabase = createClient()

/** ページ表示時に自動記録するフック（同じページで連続記録しない） */
export function usePageView(page: string) {
  const { user } = useAuth()
  const logged = useRef(false)

  useEffect(() => {
    if (!user || logged.current) return
    logged.current = true
    supabase.from('user_activity').insert({
      user_id: user.id, action: 'view_page', detail: page,
    }).then(() => {})
  }, [user, page])
}

/** 任意のアクションを記録する関数を返すフック */
export function useLogAction() {
  const { user } = useAuth()

  return useCallback((action: string, detail?: string) => {
    if (!user) return
    supabase.from('user_activity').insert({
      user_id: user.id, action, detail: detail || '',
    }).then(() => {})
  }, [user])
}
