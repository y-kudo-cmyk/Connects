'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from './client'

const supabase = createClient()

/** 承認に必要な投票数 */
export const VOTE_THRESHOLD = 3

/**
 * 投票対象の種別。将来 spot_photo, edit_request 等を追加可能。
 */
type VotableType = 'event' | 'spot'

/** テーブル名と外部キー名のマッピング */
const VOTE_TABLES: Record<VotableType, { table: string; fk: string }> = {
  event: { table: 'event_votes', fk: 'event_id' },
  spot: { table: 'spot_votes', fk: 'spot_id' },
}

type VotingResult = {
  hasVoted: boolean
  voteCount: number
  isConfirmed: boolean
  loading: boolean
  submitVote: () => Promise<{ success: boolean; error?: string }>
  refetch: () => Promise<void>
}

/**
 * 汎用投票フック
 * @param type - 投票対象の種別
 * @param resourceId - 対象リソースのID
 * @param userId - 現在のユーザーID（未ログイン時は null）
 */
export function useVoting(
  type: VotableType,
  resourceId: string,
  userId: string | null,
): VotingResult {
  const [hasVoted, setHasVoted] = useState(false)
  const [voteCount, setVoteCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const { table, fk } = VOTE_TABLES[type]

  const fetchVotes = useCallback(async () => {
    const { data, error } = await supabase
      .from(table)
      .select('user_id')
      .eq(fk, resourceId)

    if (error) {
      console.error('Vote fetch error:', error.message)
      setLoading(false)
      return
    }

    const votes = data ?? []
    setVoteCount(votes.filter((v: { user_id: string }) => v.user_id).length)
    setHasVoted(userId ? votes.some((v: { user_id: string }) => v.user_id === userId) : false)
    setLoading(false)
  }, [table, fk, resourceId, userId])

  useEffect(() => {
    fetchVotes()
  }, [fetchVotes])

  const submitVote = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'auth_required' }
    }
    if (hasVoted) {
      return { success: false, error: 'already_voted' }
    }

    const { error } = await supabase.from(table).insert({
      [fk]: resourceId,
      user_id: userId,
      vote: 'approve',
    })

    if (error) {
      if (error.message.includes('duplicate')) {
        setHasVoted(true)
        return { success: false, error: 'already_voted' }
      }
      console.error('Vote error:', error.message)
      return { success: false, error: error.message }
    }

    // DB から最新カウントを再取得（トリガー反映後の正確な値）
    await fetchVotes()
    return { success: true }
  }, [userId, hasVoted, table, fk, resourceId, fetchVotes])

  return {
    hasVoted,
    voteCount,
    isConfirmed: voteCount >= VOTE_THRESHOLD,
    loading,
    submitVote,
    refetch: fetchVotes,
  }
}
