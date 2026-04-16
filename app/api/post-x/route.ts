export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ── 設定 ──────────────────────────────────────────────────────
const CONNECT_URL = 'https://app.connectsplus.net'
const HASHTAGS = '#seventeen #carat #세븐틴'
const FOOTER = `👇詳細をチェック✨\n${CONNECT_URL}\n\n${HASHTAGS}`

const TAG_ORDER: Record<string, number> = {
  LIVE: 1, TICKET: 2, GOODS: 3, EVENT: 4,
}
// 締切通知はTICKET/EVENTの応募期間終了のみ（それ以外は除外）
const EVENING_DEADLINE_TAGS = ['TICKET', 'EVENT']
const EVENING_TAG_PRIORITY: Record<string, number> = { TICKET: 1, EVENT: 2 }

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

const COUNTRY_FLAG: Record<string, string> = {
  JP: '🇯🇵', KR: '🇰🇷', CN: '🇨🇳', HK: '🇭🇰', TW: '🇹🇼',
  TH: '🇹🇭', PH: '🇵🇭', SG: '🇸🇬', MO: '🇲🇴', US: '🇺🇸',
  FR: '🇫🇷', GB: '🇬🇧', ID: '🇮🇩', MY: '🇲🇾', VN: '🇻🇳',
}

// ── Supabase (service role) ──────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ── 日付ヘルパー ─────────────────────────────────────────────

// 「今日」をJST基準で取得（VercelはUTCで動くため）
function todayJST(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return now.toISOString().slice(0, 10)
}

// DB日時文字列からUTC日付部分をそのまま抽出（アプリ側 extractDateParts と同じ方式）
function extractDate(isoStr: string): string {
  const m = isoStr.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}

function extractTime(isoStr: string): string {
  const m = isoStr.match(/T(\d{2}:\d{2})/)
  return m ? m[1] : '00:00'
}

function formatMD(dateStr: string) {
  // "2026-04-16" → "4/16(木)"
  const [, mStr, dStr] = dateStr.match(/(\d{2})-(\d{2})$/) || []
  if (!mStr) return dateStr
  const m = parseInt(mStr, 10)
  const d = parseInt(dStr, 10)
  // 曜日は Date で計算（UTC日付を使うので十分）
  const dow = DAY_NAMES[new Date(dateStr + 'T00:00:00Z').getUTCDay()]
  return `${m}/${d}(${dow})`
}

function formatDisplayDate(start: string, end: string | null, time: string) {
  const startDate = extractDate(start)
  let display = formatMD(startDate)
  if (time && time !== '00:00') display += ` ${time}`
  if (end) {
    const endDate = extractDate(end)
    if (startDate !== endDate) {
      display += ` 〜 ${formatMD(endDate)}`
    }
  }
  return display
}

// ── 投稿文生成 ───────────────────────────────────────────────

async function generateMorning(): Promise<{ text: string; imageUrl: string }> {
  const supabase = getSupabase()
  const today = todayJST()

  // 2クエリ: (1) start_date が今日のイベント (2) 期間中(start<=today, end>=today)のイベント
  const [{ data: startToday }, { data: periodEvents }] = await Promise.all([
    supabase.from('events').select('*')
      .in('status', ['confirmed', 'pending'])
      .gte('start_date', today + 'T00:00:00')
      .lte('start_date', today + 'T23:59:59'),
    supabase.from('events').select('*')
      .in('status', ['confirmed', 'pending'])
      .lte('start_date', today + 'T23:59:59')
      .gte('end_date', today + 'T00:00:00'),
  ])

  // 重複排除してマージ
  const seen = new Set<string>()
  const todayEvents = [...(startToday || []), ...(periodEvents || [])].filter(e => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })

  if (todayEvents.length === 0) return { text: '', imageUrl: '' }

  // ソート: LIVE最優先 → 日本優先 → タグ順 → 日付優先度
  const sorted = todayEvents.map(e => {
    const startDate = extractDate(e.start_date)
    const endDate = e.end_date ? extractDate(e.end_date) : startDate
    const isLive = e.tag === 'LIVE' ? 0 : 1
    const isJP = e.country === 'JP' ? 0 : 1
    let datePriority = 5
    if (startDate === today && endDate === today) datePriority = 1
    else if (endDate === today) datePriority = 2
    else if (startDate === today && !e.end_date) datePriority = 3
    else if (startDate === today) datePriority = 4
    const tagOrder = TAG_ORDER[e.tag] || 99
    return { e, isLive, isJP, tagOrder, datePriority }
  }).sort((a, b) =>
    a.isLive !== b.isLive ? a.isLive - b.isLive :
    a.isJP !== b.isJP ? a.isJP - b.isJP :
    a.tagOrder !== b.tagOrder ? a.tagOrder - b.tagOrder :
    a.datePriority - b.datePriority
  ).map(item => item.e)

  let header = `📅 SEVENTEEN｜今日のスケジュール｜${formatMD(today)}\n\n`
  let body = ''

  for (const e of sorted) {
    const time = extractTime(e.start_date)
    const display = formatDisplayDate(e.start_date, e.end_date, time)
    const flag = COUNTRY_FLAG[e.country] || '🌍'
    body += `${flag} └ ${e.event_title}\n`
    if (e.sub_event_title) body += `　 ${e.sub_event_title}\n`
    body += `　 ${display}\n\n`
  }

  return { text: header + body + '\n' + FOOTER, imageUrl: '' }
}

async function generateSpot(): Promise<{ text: string; imageUrl: string }> {
  const supabase = getSupabase()

  const { data: spots } = await supabase
    .from('spots')
    .select('*')
    .in('status', ['confirmed', 'pending'])
    .eq('x_posted', false)
    .neq('image_url', '')

  if (!spots || spots.length === 0) return { text: '', imageUrl: '' }

  // ソースURLがあるスポット優先
  const withSource = spots.filter(s => s.source_url)
  const pool = withSource.length > 0 ? withSource : spots
  const selected = pool[Math.floor(Math.random() * pool.length)]

  const text = `📍 SEVENTEEN｜今日の聖地\n\n✨ ${selected.spot_name}\n${selected.related_artists || ''}\n\n${FOOTER}`

  return { text, imageUrl: selected.image_url || '', spotId: selected.id }
}

async function generateEvening(): Promise<{ text: string; imageUrl: string }> {
  const supabase = getSupabase()
  const today = todayJST()

  // 今日締切のイベント（end_dateが今日のTICKET/EVENT）
  const { data: endingRaw } = await supabase
    .from('events')
    .select('*')
    .in('status', ['confirmed', 'pending'])
    .in('tag', EVENING_DEADLINE_TAGS)
    .gte('end_date', today + 'T00:00:00')
    .lte('end_date', today + 'T23:59:59')

  const endingEvents = (endingRaw || []).filter(e => {
    const endTime = extractTime(e.end_date)
    return endTime !== '00:00'
  }).sort((a, b) =>
    (EVENING_TAG_PRIORITY[a.tag] || 99) - (EVENING_TAG_PRIORITY[b.tag] || 99)
  )

  // 今日追加されたイベント
  const { data: newRaw } = await supabase
    .from('events')
    .select('*')
    .in('status', ['confirmed', 'pending'])
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59')

  const newEvents = newRaw || []

  if (endingEvents.length === 0 && newEvents.length === 0) return { text: '', imageUrl: '' }

  let header = '🔔 SEVENTEEN｜新着＆締切情報\n\n'
  let body = ''

  if (endingEvents.length > 0) {
    body += '⏰ まもなく終了\n'
    for (const e of endingEvents) {
      const time = extractTime(e.start_date)
      const display = formatDisplayDate(e.start_date, e.end_date, time)
      const flag = COUNTRY_FLAG[e.country] || '🌍'
      body += `${flag} └ ${e.event_title}\n`
      if (e.sub_event_title) body += `　 ${e.sub_event_title}\n`
      body += `　 ${display}\n`
    }
    body += '\n'
  }

  if (newEvents.length > 0) {
    body += '🆕 新着スケジュール\n'
    for (const e of newEvents) {
      const time = extractTime(e.start_date)
      const display = formatDisplayDate(e.start_date, e.end_date, time)
      const flag = COUNTRY_FLAG[e.country] || '🌍'
      body += `${flag} └ ${e.event_title}\n`
      if (e.sub_event_title) body += `　 ${e.sub_event_title}\n`
      body += `　 ${display}\n`
    }
    body += '\n'
  }

  return { text: header + body + '\n' + FOOTER, imageUrl: '' }
}

// ── X (Twitter) OAuth 1.0a ──────────────────────────────────

function pct(str: string) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21').replace(/'/g, '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A')
}

function oauthHeader(method: string, url: string, params: Record<string, string> = {}) {
  const apiKey = process.env.X_API_KEY!
  const apiSecret = process.env.X_API_SECRET!
  const token = process.env.X_ACCESS_TOKEN!
  const tokenSecret = process.env.X_ACCESS_SECRET!

  const now = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomBytes(16).toString('hex')

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: now,
    oauth_token: token,
    oauth_version: '1.0',
  }

  const allParams: Record<string, string> = { ...params, ...oauthParams }
  const paramStr = Object.keys(allParams).sort()
    .map(k => `${pct(k)}=${pct(allParams[k])}`)
    .join('&')

  const baseStr = `${method.toUpperCase()}&${pct(url)}&${pct(paramStr)}`
  const signingKey = `${pct(apiSecret)}&${pct(tokenSecret)}`
  const signature = crypto.createHmac('sha1', signingKey).update(baseStr).digest('base64')

  oauthParams.oauth_signature = signature

  return 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${pct(k)}="${pct(oauthParams[k])}"`)
    .join(', ')
}

async function postTweet(text: string): Promise<string> {
  const url = 'https://api.twitter.com/2/tweets'
  const auth = oauthHeader('POST', url)
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`Tweet failed: ${res.status} ${body}`)
  return body
}

async function uploadMedia(imageUrl: string): Promise<string> {
  // 画像をダウンロード
  const imgRes = await fetch(imageUrl)
  const imgBuf = Buffer.from(await imgRes.arrayBuffer())
  const base64 = imgBuf.toString('base64')

  const url = 'https://upload.twitter.com/1.1/media/upload.json'
  const params = { media_data: base64 }
  const auth = oauthHeader('POST', url, params)

  const formBody = new URLSearchParams(params)
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth },
    body: formBody,
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`Media upload failed: ${res.status} ${body}`)
  return JSON.parse(body).media_id_string
}

async function postTweetWithImage(text: string, imageUrl: string): Promise<string> {
  const mediaId = await uploadMedia(imageUrl)
  const url = 'https://api.twitter.com/2/tweets'
  const auth = oauthHeader('POST', url)
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, media: { media_ids: [mediaId] } }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`Tweet with image failed: ${res.status} ${body}`)
  return body
}

// ── API Route ────────────────────────────────────────────────

// Vercel Cron は GET で呼ばれる
export async function GET(request: NextRequest) {
  // Vercel Cron の認証ヘッダー
  const cronSecret = request.headers.get('authorization')
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const type = request.nextUrl.searchParams.get('type') as 'morning' | 'spot' | 'evening' | 'all' || 'all'
  return handlePost(type, false)
}

// 手動呼び出し用 (dryRun 対応)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type, dryRun } = await request.json() as {
    type: 'morning' | 'spot' | 'evening' | 'all'
    dryRun?: boolean
  }
  return handlePost(type, dryRun ?? false)
}

async function handlePost(type: string, dryRun: boolean) {

  const results: { type: string; text: string; imageUrl: string; posted: boolean; error?: string }[] = []

  const types = type === 'all' ? ['morning', 'spot', 'evening'] : [type]

  for (const t of types) {
    let generated: { text: string; imageUrl: string; spotId?: string }

    switch (t) {
      case 'morning': generated = await generateMorning(); break
      case 'spot':    generated = await generateSpot(); break
      case 'evening': generated = await generateEvening(); break
      default: continue
    }

    if (!generated.text) {
      results.push({ type: t, text: '', imageUrl: '', posted: false, error: '投稿対象なし' })
      continue
    }

    if (dryRun) {
      results.push({ type: t, text: generated.text, imageUrl: generated.imageUrl, posted: false })
      continue
    }

    try {
      if (generated.imageUrl) {
        await postTweetWithImage(generated.text, generated.imageUrl)
      } else {
        await postTweet(generated.text)
      }
      // スポット投稿成功時のみ x_posted を更新
      if (t === 'spot' && generated.spotId) {
        await getSupabase().from('spots').update({ x_posted: true }).eq('id', generated.spotId)
      }
      results.push({ type: t, text: generated.text, imageUrl: generated.imageUrl, posted: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push({ type: t, text: generated.text, imageUrl: generated.imageUrl, posted: false, error: msg })
    }
  }

  return NextResponse.json({ results })
}
