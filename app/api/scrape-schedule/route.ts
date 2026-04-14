import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cheerio = require('cheerio')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const BASE_URL = 'https://www.seventeen-17.jp'

// ── HTML → イベント抽出 ─────────────────────────────────────
type ScrapedItem = { title: string; date: string; category: string }

function extractScheduleItems(html: string, year: number, month: number): ScrapedItem[] {
  const $ = (cheerio.load || cheerio.default?.load || cheerio)(html)
  const items: ScrapedItem[] = []

  $('.schedule-list-item').each((_: number, listItem: unknown) => {
    const dateText = $(listItem).find('.schedule-date').text().trim()
    const dateMatch = dateText.match(/(\d{1,2})\.(\d{1,2})/)
    if (!dateMatch) return
    const day = parseInt(dateMatch[2])
    if (day < 1 || day > 31) return
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    $(listItem).find('.schedule-event-item').each((_: number, eventEl: unknown) => {
      const title = $(eventEl).find('.schedule-title-text').text().trim().replace(/\s+/g, ' ')
      const category = $(eventEl).find('.schedule-category-label').text().trim()
      if (title && title.length > 3) {
        items.push({ title, date: dateStr, category: category || 'OTHER' })
      }
    })
  })

  return items
}

// ── カテゴリ → タグ ─────────────────────────────────────────
function categoryToTag(category: string, title: string): string {
  if (category === 'LIVE/EVENT') {
    if (title.includes('サイン会') || title.includes('POP-UP') || title.includes('ポップアップ')) return 'EVENT'
    if (title.includes('ライブビューイング') || title.includes('ライブ・ビューイング')) return 'LIVEVIEWING'
    if (title.includes('ファンミ') || title.includes('FANMEETING')) return 'LIVE'
    return 'LIVE'
  }
  if (category === 'RELEASE') return 'CD'
  if (category === 'MAGAZINE') return 'MAGAZINE'
  if (category === 'TV/RADIO') return title.includes('ラジオ') || title.includes('RADIO') ? 'RADIO' : 'TV'
  return 'EVENT'
}

// ── 重複チェック用 ──────────────────────────────────────────
function normalize(s: string): string {
  return s
    .replace(/\s+/g, '')
    .replace(/[''""「」『』【】〈〉《》（）()]/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .toLowerCase()
}

// ── API Route ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // Cron認証
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const thisYear = jst.getUTCFullYear()
  const thisMonth = jst.getUTCMonth() + 1

  // 当月 + 来月の2ヶ月分
  const months = [
    { year: thisYear, month: thisMonth },
    { year: thisMonth === 12 ? thisYear + 1 : thisYear, month: thisMonth === 12 ? 1 : thisMonth + 1 },
  ]

  // 既存イベントのキーを取得
  const { data: existing } = await supabase.from('events').select('event_title, start_date')
  const existingKeys = new Set<string>()
  for (const e of existing || []) {
    const d = e.start_date ? e.start_date.slice(0, 10) : ''
    existingKeys.add(`${normalize(e.event_title)}::${d}`)
  }

  const newEvents: Record<string, unknown>[] = []
  const log: string[] = []

  for (const { year, month } of months) {
    const url = `${BASE_URL}/posts/schedule?year=${year}&month=${month}`
    const res = await fetch(url)
    if (!res.ok) { log.push(`${year}/${month}: HTTP ${res.status}`); continue }
    const html = await res.text()
    const items = extractScheduleItems(html, year, month)
    log.push(`${year}/${month}: ${items.length}件検出`)

    for (const item of items) {
      const key = `${normalize(item.title)}::${item.date}`
      if (existingKeys.has(key)) continue
      existingKeys.add(key)

      newEvents.push({
        tag: categoryToTag(item.category, item.title),
        artist_id: 'A000000',
        event_title: item.title,
        sub_event_title: '',
        start_date: `${item.date}T00:00:00`,
        end_date: null,
        spot_name: '',
        spot_address: '',
        country: (item.title.includes('韓国') || item.title.match(/KOREA|SEOUL|INCHEON|BUSAN/i)) ? 'KR' : 'JP',
        image_url: '',
        source_url: `${BASE_URL}/posts/schedule`,
        status: 'confirmed',
        verified_count: 3,
        related_artists: '',
        submitted_by: null,
      })
    }

    await new Promise(r => setTimeout(r, 300))
  }

  // DB挿入
  let inserted = 0
  if (newEvents.length > 0) {
    for (let i = 0; i < newEvents.length; i += 50) {
      const batch = newEvents.slice(i, i + 50)
      const { error } = await supabase.from('events').insert(batch)
      if (error) log.push(`Insert error: ${error.message}`)
      else inserted += batch.length
    }
  }

  log.push(`New: ${inserted}, Skipped: ${existingKeys.size - inserted}`)

  return NextResponse.json({ log, inserted, total: newEvents.length })
}
