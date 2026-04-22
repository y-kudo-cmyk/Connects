// Weverse scraper トークン管理ユーティリティ
//
// access_token (3日) / refresh_token (90日) の期限管理を Supabase DB
// (weverse_tokens テーブル) で行う。
//
// - getLatestTokens(): DB から最新トークンを取得。なければ env フォールバック
// - parseJwtExp():      JWT の exp claim を Date 化
// - refreshTokens():    Weverse refresh API を叩いて新トークン取得
// - saveTokens():       新トークンを DB に保存 (最新1行だけ残す)
//
// Weverse API レスポンス形式は不明瞭なため、Set-Cookie と JSON body の
// 両方をパースできるよう実装してある。どちらかが取れれば成功。
//
// 注意: import type の SupabaseClient は Generic 型だが、
// 呼び出し側が service role client (`createClient(...)` 戻り値) を渡す想定。

import type { SupabaseClient } from '@supabase/supabase-js'

export type WeverseTokens = {
  access_token: string
  refresh_token: string
  device_id: string
  access_expires_at: Date
  refresh_expires_at: Date
}

/** JWT の exp claim をパースして Date 化。失敗時は epoch 0 を返す。 */
export function parseJwtExp(jwt: string): Date {
  try {
    const parts = jwt.split('.')
    if (parts.length < 2) return new Date(0)
    const payload = parts[1]
    // base64url → base64
    const b64 =
      payload.replace(/-/g, '+').replace(/_/g, '/') +
      '='.repeat((4 - (payload.length % 4)) % 4)
    const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
    if (typeof json.exp !== 'number') return new Date(0)
    return new Date(json.exp * 1000)
  } catch {
    return new Date(0)
  }
}

/** env からフォールバックトークンを組み立てる。未設定なら null。 */
function envFallback(): WeverseTokens | null {
  const access = process.env.WEVERSE_ACCESS_TOKEN
  const refresh = process.env.WEVERSE_REFRESH_TOKEN
  const device = process.env.WEVERSE_DEVICE_ID
  if (!access || !refresh || !device) return null
  return {
    access_token: access,
    refresh_token: refresh,
    device_id: device,
    access_expires_at: parseJwtExp(access),
    refresh_expires_at: parseJwtExp(refresh),
  }
}

/**
 * Supabase から最新トークンを取得。DB にレコードがなければ env にフォールバック。
 * テーブル自体が存在しない (未セットアップ) 場合も env フォールバックする。
 */
export async function getLatestTokens(
  supabase: SupabaseClient,
): Promise<WeverseTokens | null> {
  try {
    const { data, error } = await supabase
      .from('weverse_tokens')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      // テーブル未作成 / RLS 拒否などは env フォールバック
      return envFallback()
    }
    if (!data) {
      return envFallback()
    }
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      device_id: data.device_id,
      access_expires_at: new Date(data.access_expires_at),
      refresh_expires_at: new Date(data.refresh_expires_at),
    }
  } catch {
    return envFallback()
  }
}

/**
 * Weverse refresh API を叩いて新しいトークンを取得。
 * レスポンスは Set-Cookie と JSON body の両方を試行。
 */
export async function refreshTokens(
  current: WeverseTokens,
): Promise<WeverseTokens | null> {
  const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
  const cookie =
    `we2_access_token=${current.access_token}; ` +
    `we2_refresh_token=${current.refresh_token}; ` +
    `we2_device_id=${current.device_id}`

  let res: Response
  try {
    res = await fetch('https://accountapi.weverse.io/api/v1/token/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': UA,
        Cookie: cookie,
        // 一部 API は Origin / Referer も検証するため保険で付与
        Origin: 'https://weverse.io',
        Referer: 'https://weverse.io/',
      },
      body: JSON.stringify({}),
    })
  } catch (e) {
    console.error('[weverseTokens] fetch failed', (e as Error).message)
    return null
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[weverseTokens] refresh failed', res.status, text.slice(0, 500))
    return null
  }

  // 1. Set-Cookie からの抽出を試みる
  //    fetch の Headers.get('set-cookie') は複数 Set-Cookie を連結した文字列を返す
  //    (Node 環境 / undici では getSetCookie() があるが互換性重視で単純 get にする)
  const setCookie = res.headers.get('set-cookie') || ''
  const cookieAccess = /we2_access_token=([^;,\s]+)/.exec(setCookie)?.[1]
  const cookieRefresh = /we2_refresh_token=([^;,\s]+)/.exec(setCookie)?.[1]

  // 2. JSON body からの抽出も並行試行 (SDK 内部では body 返却のケースがある)
  let bodyAccess: string | undefined
  let bodyRefresh: string | undefined
  try {
    // body は一度しか読めないので clone 経由ではなく try/catch で素直に
    const body = (await res.json()) as Record<string, unknown> & {
      data?: Record<string, unknown>
    }
    bodyAccess =
      (body.access_token as string) ||
      (body.accessToken as string) ||
      (body.data?.access_token as string) ||
      (body.data?.accessToken as string)
    bodyRefresh =
      (body.refresh_token as string) ||
      (body.refreshToken as string) ||
      (body.data?.refresh_token as string) ||
      (body.data?.refreshToken as string)
  } catch {
    // body が JSON でない / 空の場合は Set-Cookie に賭ける
  }

  const newAccess = cookieAccess || bodyAccess
  const newRefresh = cookieRefresh || bodyRefresh

  if (!newAccess || !newRefresh) {
    console.error('[weverseTokens] no tokens found in response', {
      hasSetCookie: !!setCookie,
      hasBodyAccess: !!bodyAccess,
      hasBodyRefresh: !!bodyRefresh,
    })
    return null
  }

  return {
    access_token: newAccess,
    refresh_token: newRefresh,
    device_id: current.device_id,
    access_expires_at: parseJwtExp(newAccess),
    refresh_expires_at: parseJwtExp(newRefresh),
  }
}

/**
 * 新しいトークンを DB に保存。
 * 方針: weverse_tokens には最新1行だけ残す → 既存を全削除してから insert。
 */
export async function saveTokens(
  supabase: SupabaseClient,
  tokens: WeverseTokens,
): Promise<{ error: string | null }> {
  // 既存行を全削除 (UUID 0 と等しくない = 全件条件)
  const { error: delErr } = await supabase
    .from('weverse_tokens')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) {
    return { error: `delete failed: ${delErr.message}` }
  }
  const { error: insErr } = await supabase.from('weverse_tokens').insert({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    device_id: tokens.device_id,
    access_expires_at: tokens.access_expires_at.toISOString(),
    refresh_expires_at: tokens.refresh_expires_at.toISOString(),
  })
  if (insErr) {
    return { error: `insert failed: ${insErr.message}` }
  }
  return { error: null }
}
