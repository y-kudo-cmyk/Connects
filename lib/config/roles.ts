// ユーザーロール定義とヘルパー

export type UserRole = 'user' | 'fam' | 'admin' | 'banned'

/** 管理機能（編集・削除・他人の情報変更）が使えるか。admin のみ */
export function canManage(role: string | null | undefined): boolean {
  return role === 'admin'
}

/** 拡張表示（GOODS ベータ、他ユーザーの参戦履歴/コレクション閲覧等）が使えるか */
export function canViewExtended(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'fam'
}

/** 権限ラベル（プロフィール等に表示） */
export const ROLE_LABELS: Record<UserRole, string> = {
  user: '',
  fam: '👪 FAM',
  admin: '🛡 ADMIN',
  banned: '🚫 BANNED',
}
