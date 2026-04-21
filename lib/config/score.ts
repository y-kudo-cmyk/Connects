// ポイントシステムのロジック（profile/page.tsx から抽出、テスト可能にするため）

export type ScoreStats = {
  posts: number       // 投稿数（spots + spot_photos + events + url_submissions）
  approvals: number   // 承認数（event_votes + spot_photo_votes）
  edits: number       // 編集数（edit_requests + user_activity[action=edit]）
  referrals: number   // 紹介数
}

export type Rank = {
  key: 'none' | 'bronze' | 'silver' | 'gold' | 'legend' | 'master'
  label: string
  color: string
  bg: string
  initial: string
  min: number
  next: number | null
}

export const RANKS: readonly Rank[] = [
  { key: 'none',   label: 'None',   color: '#8E8E93', bg: '#F0F0F5', initial: '\u25CB', min: 0,    next: 100  },
  { key: 'bronze', label: 'Bronze', color: '#CD7F32', bg: '#F5E6D3', initial: 'B',  min: 100,  next: 500  },
  { key: 'silver', label: 'Silver', color: '#7D7D7D', bg: '#EBEBEB', initial: 'S',  min: 500,  next: 1000 },
  { key: 'gold',   label: 'Gold',   color: '#B8921A', bg: '#FBF0CC', initial: 'G',  min: 1000, next: 2000 },
  { key: 'legend', label: 'Legend', color: '#6B5EA8', bg: '#EAE6F8', initial: 'L',  min: 2000, next: 3000 },
  { key: 'master', label: 'Master', color: '#0EA5C9', bg: '#DCEFFE', initial: 'M',  min: 3000, next: null },
] as const

/**
 * ユーザー貢献度スコアを計算
 * 重み: 投稿5 / 承認1 / 編集2 / 紹介5
 */
export function calcScore(s: ScoreStats): number {
  return s.posts * 5 + s.approvals * 1 + s.edits * 2 + s.referrals * 5
}

/**
 * スコアから現在ランクを判定（降順で最初にマッチしたもの）
 */
export function getRank(score: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].min) return RANKS[i]
  }
  return RANKS[0]
}
