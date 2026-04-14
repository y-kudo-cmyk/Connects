import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cheerio = require('cheerio')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const BASE_URL = 'https://www.seventeen-17.jp'

// ── NEWSページから記事を抽出 ────────────────────────────────
type NewsItem = { title: string; date: string; category: string; url: string }

function extractNewsItems(html: string): NewsItem[] {
  const $ = (cheerio.load || cheerio.default?.load || cheerio)(html)
  const items: NewsItem[] = []

  $('dl[onclick]').each((_: number, el: unknown) => {
    const onclick = $(el).attr('onclick') || ''
    const hrefMatch = onclick.match(/location\.href='([^']+)'/)
    const url = hrefMatch ? hrefMatch[1] : ''

    const dt = $(el).find('dt')
    const dd = $(el).find('dd')

    // 日付: "2026.4.13" → "2026-04-13"
    const dateText = dt.clone().children().remove().end().text().trim()
    const dateMatch = dateText.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/)
    if (!dateMatch) return
    const dateStr = `${dateMatch[1]}-${String(parseInt(dateMatch[2])).padStart(2, '0')}-${String(parseInt(dateMatch[3])).padStart(2, '0')}`

    // カテゴリ
    const category = dt.find('.category').text().trim()

    // タイトル
    const title = dd.text().trim().replace(/\s+/g, ' ')

    if (title && title.length > 3) {
      items.push({ title, date: dateStr, category, url })
    }
  })

  return items
}

// ── カテゴリ → タグ ─────────────────────────────────────────
function categoryToTag(category: string, title: string): string {
  if (category === 'LIVE/EVENT') {
    if (title.includes('サイン会') || title.includes('POP-UP') || title.includes('ポップアップ')) return 'EVENT'
    if (title.includes('ライブビューイング') || title.includes('ライブ・ビューイング')) return 'LIVEVIEWING'
    if (title.includes('ファンミ') || title.includes('FANMEETING')) return 'LIVE'
    if (title.includes('先行') || title.includes('抽選') || title.includes('当落') || title.includes('一般発売')) return 'TICKET'
    return 'LIVE'
  }
  if (category === 'RELEASE') {
    if (title.includes('MERCHANDISE') || title.includes('グッズ') || title.includes('Merch')) return 'MERCH'
    return 'CD'
  }
  if (category === 'MEDIA') return title.includes('ラジオ') || title.includes('RADIO') ? 'RADIO' : 'TV'
  if (category === 'CARAT') return 'INFO'
  if (category === 'OTHER') return 'INFO'
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

  // 今日の日付（JST）
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const today = jst.toISOString().slice(0, 10)

  // NEWSページ取得
  const res2 = await fetch(`${BASE_URL}/posts/information`)
  if (!res2.ok) return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  const html = await res2.text()

  // 最新記事の日付だけ先にチェック（更新がなければスキップ）
  const allPageItems = extractNewsItems(html)
  if (allPageItems.length === 0 || allPageItems[0].date !== today) {
    return NextResponse.json({ log: ['No new items today'], inserted: 0, total: 0 })
  }

  const allItems = allPageItems.filter(item => item.date === today)

  // 既存イベントのキーを取得
  const { data: existing } = await supabase.from('events').select('event_title, start_date')
  const existingKeys = new Set<string>()
  for (const e of existing || []) {
    const d = e.start_date ? e.start_date.slice(0, 10) : ''
    existingKeys.add(`${normalize(e.event_title)}::${d}`)
  }

  const newEvents: Record<string, unknown>[] = []
  const log: string[] = [`Scraped ${allItems.length} items from NEWS`]

  for (const item of allItems) {
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
      source_url: item.url ? `${BASE_URL}${item.url}` : `${BASE_URL}/posts/information`,
      status: 'confirmed',
      verified_count: 3,
      related_artists: '',
      submitted_by: null,
    })
  }

  // ── 韓国 Pledis サイトもチェック ─────────────────────────────
  // 最新IDXをDBから取得して、それ以降の記事を探す
  const { data: lastKr } = await supabase
    .from('events')
    .select('source_url')
    .ilike('source_url', '%pledis.co.kr%')
    .order('created_at', { ascending: false })
    .limit(1)
  const lastIdxMatch = lastKr?.[0]?.source_url?.match(/\/(\d+)\//)
  const startIdx = lastIdxMatch ? parseInt(lastIdxMatch[1]) + 1 : 17423

  for (let idx = startIdx; idx <= startIdx + 10; idx++) {
    try {
      const krRes = await fetch(`https://pledis.co.kr/resources/_data/json/frontend/KOR/artist/seventeen/notice/view/${idx}.json`)
      if (!krRes.ok) continue
      const article = await krRes.json()
      if (!article.subject || !article.reg_date) continue

      const krDate = article.reg_date.slice(0, 10)
      const krTitle = article.subject.replace(/\s+/g, ' ').trim()
      const krKey = `${normalize(krTitle)}::${krDate}`
      if (existingKeys.has(krKey)) continue
      existingKeys.add(krKey)

      newEvents.push({
        tag: krTitle.includes('FAN MEETING') || krTitle.includes('CONCERT') || krTitle.includes('TOUR') ? 'LIVE'
          : krTitle.includes('Album') || krTitle.includes('발매') ? 'CD'
          : 'INFO',
        artist_id: 'A000000',
        event_title: krTitle,
        sub_event_title: '',
        start_date: `${krDate}T00:00:00`,
        end_date: null,
        spot_name: '',
        spot_address: '',
        country: 'KR',
        image_url: '',
        source_url: `https://pledis.co.kr/artist/detail/seventeen/notice/${idx}/`,
        status: 'confirmed',
        verified_count: 3,
        related_artists: '',
        submitted_by: null,
      })
      log.push(`KR: ${krDate} ${krTitle.slice(0, 50)}`)
    } catch { /* skip */ }
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

  log.push(`New: ${inserted}, Total checked: ${allItems.length}`)

  return NextResponse.json({ log, inserted, total: allItems.length })
}
