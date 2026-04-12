/**
 * 公式HP (seventeen-17.jp) のスケジュールページをスクレイピングして
 * Supabase events テーブルに投入するスクリプト
 *
 * 使い方:
 *   npx tsx scripts/scrape-schedule.ts [--dry-run] [--from 2024-01] [--to 2026-04]
 */

import { createClient } from '@supabase/supabase-js'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cheerio = require('cheerio')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL = 'https://www.seventeen-17.jp'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── 引数 ────────────────────────────────────────────────────
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const fromIdx = args.indexOf('--from')
const toIdx = args.indexOf('--to')
const now = new Date()
const fromMonth = fromIdx !== -1 ? args[fromIdx + 1] : '2016-01'
const toMonth = toIdx !== -1 ? args[toIdx + 1] : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

console.log(`📅 期間: ${fromMonth} 〜 ${toMonth}`)
console.log(`🔧 モード: ${dryRun ? 'DRY RUN' : '本番'}`)

// ── HTML → イベント抽出 ─────────────────────────────────────
type ScrapedItem = { title: string; date: string; category: string }

function extractScheduleItems(html: string, year: number, month: number): ScrapedItem[] {
  const $ = (cheerio.load || cheerio.default?.load || cheerio)(html)
  const items: ScrapedItem[] = []

  // schedule-list-item ごとにイベントを抽出
  // 構造: .schedule-list-item > .schedule-day-block(.schedule-date) + .schedule-event-item
  $('.schedule-list-item').each((_, listItem) => {
    const dateText = $(listItem).find('.schedule-date').text().trim()
    const dateMatch = dateText.match(/(\d{1,2})\.(\d{1,2})/)
    if (!dateMatch) return
    const day = parseInt(dateMatch[2])
    if (day < 1 || day > 31) return
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    $(listItem).find('.schedule-event-item').each((_, eventEl) => {
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
    if (title.includes('ファンミ') || title.includes('FANMEETING')) return 'LIVE'
    return 'LIVE'
  }
  if (category === 'RELEASE') return 'CD'
  if (category === 'MAGAZINE') return 'MAGAZINE'
  if (category === 'TV/RADIO') return title.includes('ラジオ') || title.includes('RADIO') ? 'RADIO' : 'TV'
  return 'EVENT'
}

// ── 重複チェック用の正規化 ───────────────────────────────────
function normalize(s: string): string {
  return s
    .replace(/\s+/g, '')
    .replace(/[''""「」『』【】〈〉《》（）()]/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .toLowerCase()
}

async function getExistingKeys(): Promise<Set<string>> {
  const { data, error } = await supabase.from('events').select('event_title, start_date')
  if (error) { console.error('DB読み取りエラー:', error.message); return new Set() }

  const keys = new Set<string>()
  for (const e of data || []) {
    const d = e.start_date ? e.start_date.slice(0, 10) : ''
    keys.add(`${normalize(e.event_title)}::${d}`)
  }
  console.log(`📊 既存イベント: ${keys.size}件`)
  return keys
}

// ── メイン ───────────────────────────────────────────────────
async function main() {
  const existingKeys = await getExistingKeys()

  const [fromY, fromM] = fromMonth.split('-').map(Number)
  const [toY, toM] = toMonth.split('-').map(Number)
  const months: { year: number; month: number }[] = []
  let y = fromY, m = fromM
  while (y < toY || (y === toY && m <= toM)) {
    months.push({ year: y, month: m }); m++
    if (m > 12) { m = 1; y++ }
  }
  console.log(`📆 対象: ${months.length}ヶ月分\n`)

  let totalNew = 0, totalSkipped = 0
  const newEvents: Record<string, unknown>[] = []

  for (const { year, month } of months) {
    const url = `${BASE_URL}/posts/schedule?year=${year}&month=${month}`
    console.log(`  📥 ${year}/${month}`)

    const res = await fetch(url)
    if (!res.ok) { console.log(`  ⚠️ HTTP ${res.status}`); continue }
    const html = await res.text()

    // console.log(`     HTML: ${html.length}文字`)
    const items = extractScheduleItems(html, year, month)
    console.log(`     → ${items.length}件検出`)

    for (const item of items) {
      const key = `${normalize(item.title)}::${item.date}`
      if (existingKeys.has(key)) { totalSkipped++; continue }
      existingKeys.add(key)
      totalNew++

      newEvents.push({
        tag: categoryToTag(item.category, item.title),
        artist_id: 'A000000',
        event_title: item.title,
        sub_event_title: '',
        start_date: `${item.date}T00:00:00`,
        end_date: null,
        spot_name: '',
        spot_address: '',
        lat: null, lng: null,
        country: (item.title.includes('韓国') || item.title.match(/KOREA|SEOUL|INCHEON|BUSAN/i)) ? 'KR' : 'JP',
        image_url: '',
        source_url: `${BASE_URL}/posts/schedule`,
        notes: '',
        status: 'confirmed',
        verified_count: 3,
        related_artists: '',
      })
    }

    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📊 新規 ${totalNew}件 / スキップ(重複) ${totalSkipped}件`)

  if (dryRun) {
    console.log(`\n🔍 新規イベント:`)
    newEvents.forEach((e, i) => {
      console.log(`  ${String(e.start_date).slice(0, 10)} | ${String(e.tag).padEnd(8)} | ${e.event_title}`)
    })
    console.log(`\n⚠️ DRY RUN: DBには書き込んでいません`)
    return
  }

  if (newEvents.length === 0) { console.log('✅ 新規なし'); return }

  console.log(`\n💾 ${newEvents.length}件を挿入中...`)
  for (let i = 0; i < newEvents.length; i += 50) {
    const batch = newEvents.slice(i, i + 50)
    const { error } = await supabase.from('events').insert(batch)
    if (error) console.error(`  ❌ ${i}〜: ${error.message}`)
    else console.log(`  ✅ ${i + 1}〜${i + batch.length}件`)
  }
  console.log(`\n🎉 完了！`)
}

main().catch(console.error)
