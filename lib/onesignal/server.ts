/**
 * OneSignal REST API — サーバーサイド送信
 * Server Actions / API Routes / Cron Jobs から利用
 */

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
const REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY
const API_BASE = 'https://api.onesignal.com/api/v1'

type SendTarget =
  | { type: 'all' }
  | { type: 'users'; userIds: string[] }
  | { type: 'segment'; segment: string }

interface NotificationPayload {
  title: string
  message: string
  url?: string
  target: SendTarget
}

export async function sendPushNotification(payload: NotificationPayload) {
  if (!APP_ID || !REST_API_KEY) {
    console.warn('[OneSignal Server] Missing API keys. Skipping push.')
    return null
  }

  const body: Record<string, unknown> = {
    app_id: APP_ID,
    headings: { en: payload.title },
    contents: { en: payload.message },
  }

  if (payload.url) {
    body.url = payload.url
  }

  switch (payload.target.type) {
    case 'all':
      body.included_segments = ['Subscribed Users']
      break
    case 'users':
      body.include_aliases = { external_id: payload.target.userIds }
      body.target_channel = 'push'
      break
    case 'segment':
      body.included_segments = [payload.target.segment]
      break
  }

  const res = await fetch(`${API_BASE}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${REST_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error('[OneSignal Server] Failed to send:', error)
    throw new Error(`OneSignal API error: ${res.status}`)
  }

  return res.json()
}
