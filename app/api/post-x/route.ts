import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ── 設定 ──────────────────────────────────────────────────────
const CONNECT_URL = 'https://connects-nu.vercel.app'
const HASHTAGS = '#seventeen #carat #세븐틴'
const FOOTER = `👇詳細をチェック✨\n${CONNECT_URL}\n\n${HASHTAGS}`

const TAG_ORDER: Record<string, number> = {
  LIVE: 1, TICKET: 2, GOODS: 3, EVENT: 4,
}
const EXCLUDE_EVENING_TAGS = ['LIVE', 'POPUP']
const EVENING_TAG_PRIORITY: Record<string, number> = { TICKET: 1, EVENT: 2 }

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

// ── Supabase (service role) ──────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ── 日付ヘルパー ─────────────────────────────────────────────
function toJSTDate(d: Date) {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000)
}

function formatYMD(d: Date) {
  const jst = toJSTDate(d)
  return jst.toISOString().slice(0, 10)
}

function formatMD(d: Date) {
  const jst = toJSTDate(d)
  const m = jst.getUTCMonth() + 1
  const day = jst.getUTCDate()
  const dow = DAY_NAMES[jst.getUTCDay()]
  return `${m}/${day}(${dow})`
}

function formatDisplayDate(start: string, end: string | null, time: string) {
  const s = new Date(start)
  let display = formatMD(s)
  if (time && time !== '00:00') display += ` ${time}`
  if (end) {
    const e = new Date(end)
    if (formatYMD(s) !== formatYMD(e)) {
      display += ` 〜 ${formatMD(e)}`
    }
  }
  return display
}

// ── 投稿文生成 ───────────────────────────────────────────────

async function generateMorning(): Promise<{ text: string; imageUrl: string }> {
  const supabase = getSupabase()
  const todayStr = formatYMD(new Date())

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('status', ['confirmed', 'pending'])
    .lte('start_date', todayStr + 'T23:59:59')
    .order('start_date')

  if (!events || events.length === 0) return { text: '', imageUrl: '' }

  // 期間イベントも含めてフィルタ（end_date >= today または end_date が null で start_date が today）
  const todayEvents = events.filter(e => {
    const startDate = formatYMD(new Date(e.start_date))
    const endDate = e.end_date ? formatYMD(new Date(e.end_date)) : startDate
    return startDate <= todayStr && todayStr <= endDate
  })

  if (todayEvents.length === 0) return { text: '', imageUrl: '' }

  // ソート: 今日だけ > 最終日 > 開始日(終了なし) > 開始日(終了あり) > 期間中、各カテゴリ内でTAGソート
  const sorted = todayEvents.map(e => {
    const startDate = formatYMD(new Date(e.start_date))
    const endDate = e.end_date ? formatYMD(new Date(e.end_date)) : startDate
    let primary = 5
    if (startDate === todayStr && endDate === todayStr) primary = 1
    else if (endDate === todayStr) primary = 2
    else if (startDate === todayStr && !e.end_date) primary = 3
    else if (startDate === todayStr) primary = 4
    const secondary = TAG_ORDER[e.tag] || 99
    return { e, primary, secondary }
  }).sort((a, b) => a.primary !== b.primary ? a.primary - b.primary : a.secondary - b.secondary)
    .map(item => item.e)

  const todayLabel = formatMD(new Date())
  let header = `📅 SEVENTEEN｜今日のスケジュール｜${todayLabel}\n\n`
  let body = ''

  for (const e of sorted) {
    const time = e.start_date ? new Date(e.start_date).toISOString().slice(11, 16) : '00:00'
    const display = formatDisplayDate(e.start_date, e.end_date, time)
    body += `└ ${e.event_title}\n`
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
    .eq('status', 'confirmed')
    .eq('x_posted', false)
    .neq('image_url', '')

  if (!spots || spots.length === 0) return { text: '', imageUrl: '' }

  // ソースURLがあるスポット優先
  const withSource = spots.filter(s => s.source_url)
  const pool = withSource.length > 0 ? withSource : spots
  const selected = pool[Math.floor(Math.random() * pool.length)]

  const text = `📍 SEVENTEEN｜今日の聖地\n\n✨ ${selected.spot_name}\n${selected.related_artists || ''}\n\n${FOOTER}`

  // x_posted を true に更新
  await supabase.from('spots').update({ x_posted: true }).eq('id', selected.id)

  return { text, imageUrl: selected.image_url || '' }
}

async function generateEvening(): Promise<{ text: string; imageUrl: string }> {
  const supabase = getSupabase()
  const todayStr = formatYMD(new Date())

  // 今日締切のイベント
  const { data: allEvents } = await supabase
    .from('events')
    .select('*')
    .in('status', ['confirmed', 'pending'])

  if (!allEvents) return { text: '', imageUrl: '' }

  const endingEvents = allEvents.filter(e => {
    if (!e.end_date) return false
    const tag = e.tag || ''
    if (EXCLUDE_EVENING_TAGS.includes(tag)) return false
    const endStr = e.end_date ? new Date(e.end_date).toISOString().slice(11, 16) : ''
    if (!endStr || endStr === '00:00') return false
    return formatYMD(new Date(e.end_date)) === todayStr
  }).sort((a, b) =>
    (EVENING_TAG_PRIORITY[a.tag] || 99) - (EVENING_TAG_PRIORITY[b.tag] || 99)
  )

  // 今日追加されたイベント
  const newEvents = allEvents.filter(e => {
    if (!e.created_at) return false
    return formatYMD(new Date(e.created_at)) === todayStr
  })

  if (endingEvents.length === 0 && newEvents.length === 0) return { text: '', imageUrl: '' }

  let header = '🔔 SEVENTEEN｜新着＆締切情報\n\n'
  let body = ''

  if (endingEvents.length > 0) {
    body += '⏰ まもなく終了\n'
    for (const e of endingEvents) {
      const time = e.start_date ? new Date(e.start_date).toISOString().slice(11, 16) : '00:00'
      const display = formatDisplayDate(e.start_date, e.end_date, time)
      body += `└ ${e.event_title}\n`
      if (e.sub_event_title) body += `　 ${e.sub_event_title}\n`
      body += `　 ${display}\n`
    }
    body += '\n'
  }

  if (newEvents.length > 0) {
    body += '🆕 新着スケジュール\n'
    for (const e of newEvents) {
      const time = e.start_date ? new Date(e.start_date).toISOString().slice(11, 16) : '00:00'
      const display = formatDisplayDate(e.start_date, e.end_date, time)
      body += `└ ${e.event_title}\n`
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
    let generated: { text: string; imageUrl: string }

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
      results.push({ type: t, text: generated.text, imageUrl: generated.imageUrl, posted: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push({ type: t, text: generated.text, imageUrl: generated.imageUrl, posted: false, error: msg })
    }
  }

  return NextResponse.json({ results })
}
