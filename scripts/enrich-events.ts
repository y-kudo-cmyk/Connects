/**
 * 公式HPのスケジュール詳細ページから会場情報を取得し、
 * 既存イベントの spot_name と source_url を更新するスクリプト
 *
 * npx tsx scripts/enrich-events.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cheerio = require('cheerio')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL = 'https://www.seventeen-17.jp'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const dryRun = process.argv.includes('--dry-run')
console.log(`🔧 モード: ${dryRun ? 'DRY RUN' : '本番'}`)

// ── スケジュール一覧から個別URLを取得 ────────────────────────
async function getDetailLinks(year: number, month: number): Promise<Map<string, string>> {
  // key: "YYYY-MM-DD::normalizedTitle" → value: detail URL
  const links = new Map<string, string>()
  const url = `${BASE_URL}/posts/schedule?year=${year}&month=${month}`
  const res = await fetch(url)
  if (!res.ok) return links

  const html = await res.text()
  const $ = (cheerio.load || cheerio)(html)

  $('.schedule-list-item').each((_: number, el: cheerio.Element) => {
    const dateText = $(el).find('.schedule-date').text().trim()
    const dateMatch = dateText.match(/(\d{1,2})\.(\d{1,2})/)
    if (!dateMatch) return
    const day = parseInt(dateMatch[2])
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    $(el).find('.schedule-event-item').each((_2: number, ev: cheerio.Element) => {
      const title = $(ev).find('.schedule-title-text').text().trim().replace(/\s+/g, ' ')
      const href = $(ev).find('.schedule-title-link').attr('href')
      if (title && href) {
        const key = `${dateStr}::${normalize(title)}`
        links.set(key, `${BASE_URL}${href}`)
      }
    })
  })

  return links
}

function normalize(s: string): string {
  return s.replace(/\s+/g, '').replace(/[''""「」『』【】〈〉《》（）()]/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).toLowerCase()
}

// ── 詳細ページから会場情報を抽出 ─────────────────────────────
async function fetchVenueFromDetail(detailUrl: string): Promise<string> {
  try {
    const res = await fetch(detailUrl)
    if (!res.ok) return ''
    const html = await res.text()
    const $ = (cheerio.load || cheerio)(html)
    const content = $('.post-content').text() || $('body').text()

    // 会場パターン
    // [愛知] バンテリンドーム ナゴヤ
    const bracketMatch = content.match(/\[([^\]]+)\]\s*([^\n\d]{2,30})/)
    if (bracketMatch) return `${bracketMatch[2].trim()} (${bracketMatch[1]})`

    // 会場：XXX or 会場: XXX
    const venueMatch = content.match(/会場[：:]\s*([^\n]{3,50})/)
    if (venueMatch) return venueMatch[1].trim()

    // 場所：XXX
    const placeMatch = content.match(/場所[：:]\s*([^\n]{3,50})/)
    if (placeMatch) return placeMatch[1].trim()

    return ''
  } catch {
    return ''
  }
}

// ── メイン ───────────────────────────────────────────────────
async function main() {
  // 1. DBからソースURLが一覧ページのイベントを取得
  const { data: events, error } = await supabase
    .from('events')
    .select('id, event_title, start_date, spot_name, source_url')
    .or('source_url.eq.https://www.seventeen-17.jp/posts/schedule,source_url.eq.')

  if (error) { console.error('DB error:', error.message); return }
  console.log(`📊 対象イベント: ${events?.length}件`)

  // 2. 月ごとにグループ化
  const monthSet = new Set<string>()
  for (const e of events || []) {
    if (e.start_date) monthSet.add(e.start_date.slice(0, 7))
  }
  const months = [...monthSet].sort()
  console.log(`📆 対象月: ${months.length}ヶ月\n`)

  // 3. 各月のスケジュール一覧から個別URLを取得
  const allLinks = new Map<string, string>()
  for (const ym of months) {
    const [y, m] = ym.split('-').map(Number)
    const links = await getDetailLinks(y, m)
    for (const [k, v] of links) allLinks.set(k, v)
    process.stdout.write(`  📥 ${ym}: ${links.size}件のリンク\n`)
    await new Promise(r => setTimeout(r, 300))
  }
  console.log(`\n🔗 合計リンク: ${allLinks.size}件`)

  // 4. イベントとマッチング → 詳細ページから会場取得
  let updatedUrl = 0, updatedVenue = 0, fetchedDetail = 0
  const detailCache = new Map<string, string>() // URL → venue

  for (const event of events || []) {
    if (!event.start_date) continue
    const dateStr = event.start_date.slice(0, 10)
    const key = `${dateStr}::${normalize(event.event_title)}`
    const detailUrl = allLinks.get(key)

    if (!detailUrl) continue

    const updates: Record<string, string> = {}

    // ソースURLを個別ページURLに更新
    if (!event.source_url || event.source_url === 'https://www.seventeen-17.jp/posts/schedule') {
      updates.source_url = detailUrl
      updatedUrl++
    }

    // 会場が空なら詳細ページから取得
    if (!event.spot_name) {
      let venue = detailCache.get(detailUrl)
      if (venue === undefined) {
        venue = await fetchVenueFromDetail(detailUrl)
        detailCache.set(detailUrl, venue)
        fetchedDetail++
        await new Promise(r => setTimeout(r, 200))
      }
      if (venue) {
        updates.spot_name = venue
        updatedVenue++
      }
    }

    if (Object.keys(updates).length > 0) {
      if (dryRun) {
        console.log(`  ${dateStr} | ${event.event_title.slice(0, 40)} → url:${updates.source_url ? '✓' : '-'} venue:${updates.spot_name || '-'}`)
      } else {
        await supabase.from('events').update(updates).eq('id', event.id)
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📊 ソースURL更新: ${updatedUrl}件`)
  console.log(`📊 会場追加: ${updatedVenue}件`)
  console.log(`📊 詳細ページ取得: ${fetchedDetail}件`)
  if (dryRun) console.log(`\n⚠️ DRY RUN: DBには書き込んでいません`)
  else console.log(`\n🎉 完了！`)
}

main().catch(console.error)
