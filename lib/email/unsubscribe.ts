import { createHmac } from 'node:crypto'

const SECRET = process.env.UNSUBSCRIBE_SECRET || ''

/**
 * メールごとのユニーク配信停止トークン生成
 * メールごとに決定論的に計算される (HMAC) のでDBに保存不要
 */
export function unsubscribeToken(email: string): string {
  if (!SECRET) throw new Error('UNSUBSCRIBE_SECRET is not configured')
  const h = createHmac('sha256', SECRET)
  h.update(email.toLowerCase().trim())
  return h.digest('base64url').slice(0, 32)
}

/**
 * メール本文に埋め込む unsubscribe URL
 * origin は環境変数 APP_URL または 'https://app.connectsplus.net'
 */
export function unsubscribeUrl(email: string): string {
  const origin = process.env.APP_URL || 'https://app.connectsplus.net'
  const t = unsubscribeToken(email)
  return `${origin}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${t}`
}
