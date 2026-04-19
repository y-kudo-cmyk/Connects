'use client'

import { useState, useEffect } from 'react'
import { createClient } from './supabase/client'

const supabase = createClient()

/**
 * DB から自分の紹介コード + 招待者コードを取得
 * 既存 profiles.ref_code / introduced_by を参照。
 */
export function useReferral() {
  const [myCode, setMyCode] = useState<string>('')
  const [introducedBy, setIntroducedBy] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('profiles')
        .select('ref_code, introduced_by')
        .eq('id', user.id)
        .maybeSingle()
      if (cancelled) return
      setMyCode(data?.ref_code || '')
      setIntroducedBy(data?.introduced_by || '')
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  /** 紹介者コードを設定 (1回だけ、既に設定済みなら上書き不可) */
  const setIntroducer = async (code: string): Promise<{ ok: boolean; error?: string }> => {
    const trimmed = code.trim()
    if (!trimmed) return { ok: false, error: 'コードを入力してください' }
    if (introducedBy) return { ok: false, error: '既に紹介者が設定されています' }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'ログインしてください' }
    if (trimmed === myCode) return { ok: false, error: '自分のコードは登録できません' }

    // コード存在チェック
    const { data: refUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('ref_code', trimmed)
      .maybeSingle()
    if (!refUser) return { ok: false, error: 'そのコードのユーザーは見つかりません' }

    const { error } = await supabase
      .from('profiles')
      .update({ introduced_by: trimmed })
      .eq('id', user.id)
    if (error) return { ok: false, error: error.message }
    setIntroducedBy(trimmed)
    return { ok: true }
  }

  // 旧 API 互換: /join, /onboarding で使ってた verified / verify は
  // URL 紹介制度を廃止したので常に true / no-op とする (登録は自由)
  const verified = true
  const verify = () => {}

  return { myCode, introducedBy, loading, setIntroducer, verified, verify }
}
