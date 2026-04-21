import { describe, it, expect } from 'vitest'
import { calcScore, getRank, RANKS } from './score'

describe('calcScore', () => {
  it('全て 0 ならスコア 0', () => {
    expect(calcScore({ posts: 0, approvals: 0, edits: 0, referrals: 0 })).toBe(0)
  })

  it('投稿 1 件 = 5 pt', () => {
    expect(calcScore({ posts: 1, approvals: 0, edits: 0, referrals: 0 })).toBe(5)
  })

  it('承認 1 件 = 1 pt', () => {
    expect(calcScore({ posts: 0, approvals: 1, edits: 0, referrals: 0 })).toBe(1)
  })

  it('編集 1 件 = 2 pt', () => {
    expect(calcScore({ posts: 0, approvals: 0, edits: 1, referrals: 0 })).toBe(2)
  })

  it('紹介 1 人 = 5 pt', () => {
    expect(calcScore({ posts: 0, approvals: 0, edits: 0, referrals: 1 })).toBe(5)
  })

  it('合算ケース: 投稿10 + 承認20 + 編集5 + 紹介3 = 95', () => {
    expect(calcScore({ posts: 10, approvals: 20, edits: 5, referrals: 3 })).toBe(
      10 * 5 + 20 * 1 + 5 * 2 + 3 * 5,
    )
  })
})

describe('getRank', () => {
  it('スコア 0 → None', () => {
    expect(getRank(0).key).toBe('none')
  })

  it('スコア 99 → None（境界手前）', () => {
    expect(getRank(99).key).toBe('none')
  })

  it('スコア 100 → Bronze（境界）', () => {
    expect(getRank(100).key).toBe('bronze')
  })

  it('スコア 499 → Bronze', () => {
    expect(getRank(499).key).toBe('bronze')
  })

  it('スコア 500 → Silver', () => {
    expect(getRank(500).key).toBe('silver')
  })

  it('スコア 1000 → Gold', () => {
    expect(getRank(1000).key).toBe('gold')
  })

  it('スコア 2000 → Legend', () => {
    expect(getRank(2000).key).toBe('legend')
  })

  it('スコア 3000 → Master', () => {
    expect(getRank(3000).key).toBe('master')
  })

  it('スコア 99999 → Master', () => {
    expect(getRank(99999).key).toBe('master')
  })
})

describe('RANKS データ整合性', () => {
  it('各ランクの min は昇順', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].min).toBeGreaterThan(RANKS[i - 1].min)
    }
  })

  it('最後のランクだけ next = null', () => {
    expect(RANKS[RANKS.length - 1].next).toBeNull()
    for (let i = 0; i < RANKS.length - 1; i++) {
      expect(RANKS[i].next).toBe(RANKS[i + 1].min)
    }
  })
})
