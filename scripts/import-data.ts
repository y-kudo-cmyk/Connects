/**
 * Glide CSV → Supabase データインポートスクリプト
 *
 * 使い方:
 *   npx tsx scripts/import-data.ts
 *
 * 前提:
 *   - .env.local に NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY が設定済み
 *   - data/glide-export/ に CSV ファイルが配置済み
 *   - Supabase にテーブルが作成済み（docs/supabase-schema.sql を実行済み）
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Supabase Admin Client ────────────────────────────────────
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}
const supabase = createClient(url, key, { auth: { persistSession: false } })

// ── CSV パーサー（簡易・引用符対応） ─────────────────────────
function parseCSV(content: string): Record<string, string>[] {
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current)
      current = ''
    } else if (ch === '\r' && !inQuotes) {
      // skip
    } else {
      current += ch
    }
  }
  if (current.trim()) lines.push(current)

  if (lines.length < 2) return []
  const headers = splitCSVLine(lines[0])
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const vals = splitCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, j) => { row[h.trim()] = (vals[j] ?? '').trim() })
    rows.push(row)
  }
  return rows
}

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function readCSV(filename: string): Record<string, string>[] {
  const path = resolve(__dirname, '..', 'data', 'glide-export', filename)
  try {
    const content = readFileSync(path, 'utf-8')
    return parseCSV(content)
  } catch {
    // fallback to Downloads
    const dlPath = resolve('C:/Users/D-LINE/Downloads', filename)
    const content = readFileSync(dlPath, 'utf-8')
    return parseCSV(content)
  }
}

// ── メンバー色マップ ─────────────────────────────────────────
const MEMBER_COLORS: Record<string, string> = {
  'S.COUPS': '#FF6B6B', 'JEONGHAN': '#FFD93D', 'JOSHUA': '#6BCB77',
  'JUN': '#4D96FF', 'HOSHI': '#FF922B', 'WONWOO': '#6366F1',
  'WOOZI': '#EC4899', 'THE 8': '#84CC16', 'MINGYU': '#14B8A6',
  'DK': '#F97316', 'SEUNGKWAN': '#EF4444', 'VERNON': '#A78BFA',
  'DINO': '#06B6D4',
}

// ── 日付パーサー ─────────────────────────────────────────────
function parseDate(raw: string): string | null {
  if (!raw) return null
  // "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD"
  if (raw.match(/^\d{4}-\d{2}-\d{2}/)) {
    return raw.replace(' ', 'T') + (raw.includes('T') || raw.includes(' ') ? '' : 'T00:00:00')
  }
  // "MM/DD HH:MM" — 年がない場合は2026年を仮定
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\s*(\d{1,2}:\d{2})?/)
  if (match) {
    const m = match[1].padStart(2, '0')
    const d = match[2].padStart(2, '0')
    const t = match[3] ?? '00:00'
    return `2026-${m}-${d}T${t}:00`
  }
  return null
}

// ── related_artists パーサー ─────────────────────────────────
function parseRelatedArtists(raw: string): string {
  // "#SEVENTEEN #S.COUPS #MINGYU" → そのまま維持
  // "S.COUPS,MINGYU,CXM" → "#SEVENTEEN #S.COUPS #MINGYU #CXM" に変換
  if (raw.startsWith('#')) return raw
  if (!raw) return ''
  const members = raw.split(',').map(s => s.trim()).filter(Boolean)
  return members.map(m => `#${m}`).join(' ')
}

// ── DB タグ → schedule_tags.id 変換 ─────────────────────────
const TAG_MAP: Record<string, string> = {
  'LIVE': 'LIVE',
  'TICKET': 'TICKET',
  'CD': 'CD',
  'LUCKY DRAW': 'LUCKY_DRAW',
  'POPUP': 'POPUP',
  'MERCH': 'MERCH',
  'RELEASE': 'RELEASE',
  '誕生日': 'BIRTHDAY',
  '雑誌': 'MAGAZINE',
  'EVENT': 'EVENT',
  'TV': 'TV',
  'YOUTUBE': 'YOUTUBE',
  'RADIO': 'RADIO',
}

// ============================================================
// インポート関数
// ============================================================

async function importArtists() {
  console.log('\n🎤 Importing artists...')
  const rows = readCSV('ARTIST_MASTER.csv')

  // 有効な artist_id を収集
  const validIds = new Set(rows.filter(r => r.artist_id).map(r => r.artist_id))

  // GROUP を先に、MEMBER/UNIT を後に（外部キー制約のため）
  const groups = rows.filter(r => r.artist_id && r.artist_name && r.level === 'GROUP')
  const others = rows.filter(r => r.artist_id && r.artist_name && r.level !== 'GROUP')

  const toRecord = (r: Record<string, string>) => {
    // GROUP は group_id = null
    // MEMBER/UNIT の group_id は GROUP の artist_id に紐づける
    // Glide では group_id が最初のメンバーIDを指しているので、GROUP の ID に変換
    let finalGroupId: string | null = null
    if (r.level !== 'GROUP' && r.group_id) {
      // group_id が GROUP レコードの ID と一致するか確認
      const isGroup = rows.some(x => x.artist_id === r.group_id && x.level === 'GROUP')
      if (isGroup) {
        finalGroupId = r.group_id
      } else {
        // group_id が MEMBER を指している場合 → その MEMBER と同じ group_id を持つ GROUP を探す
        const sameGroup = rows.find(x => x.level === 'GROUP' && x.group_id === r.group_id)
        finalGroupId = sameGroup?.artist_id ?? null
      }
    }
    // birthday を検証
    const bday = r.birthday && r.birthday.match(/^\d{4}-\d{2}-\d{2}$/) ? r.birthday : null
    // 入隊日・除隊日を検証
    const enlist = r['入隊日'] && r['入隊日'].match(/^\d{4}-\d{2}-\d{2}$/) ? r['入隊日'] : null
    const discharge = r['除隊日'] && r['除隊日'].match(/^\d{4}-\d{2}-\d{2}$/) ? r['除隊日'] : null

    return {
      id: r.artist_id,
      artist_type: (r['artist_type '] || r.artist_type || '').trim() || null,
      level: r.level || 'GROUP',
      group_id: finalGroupId,
      name: r.artist_name,
      birthday: bday,
      fandom_name: r.fandom_name || '',
      name_ja: r.name_ja || '',
      name_en: r.name_en || '',
      name_ko: r.name_ko || '',
      display_name: r.display_name || '',
      search_text: r.serch || r.search || '',
      instagram_url: r.instagram_url || '',
      x_url: r.x_url || '',
      official_url: r.official_url || '',
      youtube_url: r.youtube_url || '',
      color: MEMBER_COLORS[r.artist_name] || '#636366',
      image_url: r.image || '',
      enlist_date: enlist,
      discharge_date: discharge,
      sort_order: parseInt(r.artist_id.replace('A', '')) || 0,
    }
  }

  // GROUP を先に投入
  const groupRecords = groups.map(toRecord)
  const { error: e1 } = await supabase.from('artists').upsert(groupRecords, { onConflict: 'id' })
  if (e1) console.error('  ❌ artists (groups):', e1.message)

  // MEMBER/UNIT を後から投入
  const otherRecords = others.map(toRecord)
  const { error: e2 } = await supabase.from('artists').upsert(otherRecords, { onConflict: 'id' })
  if (e2) console.error('  ❌ artists (members):', e2.message)
  else console.log(`  ✅ ${groupRecords.length + otherRecords.length} artists imported`)
}

async function importScheduleTags() {
  console.log('\n🏷️  Importing schedule tags...')
  // タグはスキーマのINSERT文で投入済みなのでスキップ
  console.log('  ✅ Tags are seeded via schema SQL')
}

async function importSchedules() {
  console.log('\n📅 Importing schedules...')
  const rows = readCSV('SCHEDULE_DB.csv')

  // schedule + PUBLISHED のみ、誕生日は各メンバー1行だけ
  const birthdaySeen = new Set<string>()
  const events: any[] = []

  for (const r of rows) {
    if (r.post_type !== 'schedule' && r.status !== 'PUBLISHED') continue
    if (!r.event_title) continue

    const tag = TAG_MAP[r.tag] || null
    if (!tag) continue

    // 誕生日: メンバーごとに1行のみ（最初の1行を採用）
    if (tag === 'BIRTHDAY') {
      const key = r.event_title
      if (birthdaySeen.has(key)) continue
      birthdaySeen.add(key)
    }

    const startDate = parseDate(r.start_date || r['F)start_date'])
    if (!startDate) continue

    // 誕生日の年を除去（毎年リピート用に月日のみ使う → 2000年ベースに）
    let finalStartDate = startDate
    if (tag === 'BIRTHDAY') {
      const md = startDate.slice(5, 10) // MM-DD
      finalStartDate = `2000-${md}T00:00:00`
    }

    const endDate = parseDate(r.end_date || r['F)end_date'])
    const verified = r.verified_count ? parseInt(r.verified_count.replace('３', '3')) : 0

    events.push({
      tag,
      artist_id: 'A000000', // SEVENTEEN
      related_artists: parseRelatedArtists(r.related_artists || ''),
      event_title: r.event_title,
      sub_event_title: r.sub_event_title || '',
      start_date: finalStartDate,
      end_date: endDate,
      spot_name: r.spot_name || '',
      spot_address: r.spot_address || '',
      lat: r['緯度'] ? parseFloat(r['緯度']) : null,
      lng: r['経度'] ? parseFloat(r['経度']) : null,
      country: r.Country || '',
      image_url: r['1)image_url'] || '',
      source_url: r.source_url || '',
      notes: r.notes || '',
      status: verified >= 3 ? 'confirmed' : 'pending',
      verified_count: verified,
    })
  }

  // 1件ずつ挿入（重複はスキップ）
  let inserted = 0
  let skipped = 0
  for (const event of events) {
    const { error } = await supabase.from('events').insert(event)
    if (error) {
      if (error.message.includes('duplicate')) { skipped++; continue }
      console.error(`  ❌ event "${event.event_title}":`, error.message)
    } else {
      inserted++
    }
  }
  console.log(`  ✅ ${inserted} events imported, ${skipped} duplicates skipped (${birthdaySeen.size} birthdays deduplicated)`)
}

async function importSpots() {
  console.log('\n📍 Importing spots...')
  const rows = readCSV('SPOT_DB.csv')

  // spot_id でグループ化（同じスポットに複数写真がある）
  const spotMap = new Map<string, any>()
  const photos: any[] = []

  for (const r of rows) {
    if (!r.spot_id || !r.spot_name) continue

    // スポット本体（最初の行を採用）
    if (!spotMap.has(r.spot_id)) {
      const lat = r['緯度'] ? parseFloat(r['緯度']) : null
      const lng = r['経度'] ? parseFloat(r['経度']) : null
      const verified = r.verified_count ? parseFloat(r.verified_count) : 0

      spotMap.set(r.spot_id, {
        id: r.spot_id,
        spot_name: r.spot_name,
        spot_address: r.spot_address || '',
        spot_url: r.spot_url || '',
        genre: 'OTHER', // Glideデータにジャンル情報なし → 後で手動設定
        artist_id: 'A000001',
        related_artists: parseRelatedArtists(r.related_artists || ''),
        image_url: r.image_url || '',
        source_url: r.source_url || '',
        memo: r.memo || '',
        lat,
        lng,
        is_master: r.is_master === '1.0' || r.is_master === '1',
        status: verified >= 3 ? 'confirmed' : (verified >= 1 ? 'confirmed' : 'pending'),
        verified_count: Math.floor(verified),
        x_posted: r.x_posted === '1.0' || r.x_posted === '1',
      })
    }

    // 写真（各行が1写真）
    if (r.image_url) {
      photos.push({
        spot_id: r.spot_id,
        image_url: r.image_url,
        source_url: r.source_url || '',
        platform: detectPlatform(r.source_url || ''),
        tags: parseRelatedArtists(r.related_artists || ''),
        contributor: 'SEVENTEEN',
        visit_date: r.start_date ? parseDate(r.start_date)?.slice(0, 10) : null,
        status: 'confirmed',
        votes: 3,
      })
    }
  }

  // スポット挿入
  const spots = Array.from(spotMap.values())
  for (let i = 0; i < spots.length; i += 50) {
    const batch = spots.slice(i, i + 50)
    const { error } = await supabase.from('spots').upsert(batch, { onConflict: 'id' })
    if (error) console.error(`  ❌ spots batch ${i}:`, error.message)
  }
  console.log(`  ✅ ${spots.length} spots imported`)

  // 写真挿入
  for (let i = 0; i < photos.length; i += 50) {
    const batch = photos.slice(i, i + 50)
    const { error } = await supabase.from('spot_photos').insert(batch)
    if (error) console.error(`  ❌ photos batch ${i}:`, error.message)
  }
  console.log(`  ✅ ${photos.length} spot photos imported`)
}

function detectPlatform(url: string): string {
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('weverse.io')) return 'weverse'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'x'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  return 'other'
}

async function importUsers() {
  console.log('\n👤 Importing users (profile stubs)...')
  const rows = readCSV('USER_MASTER.csv')

  // ※ Supabase Auth のユーザーは別途作成が必要
  // ここではプロフィールデータの準備のみ
  const users = rows
    .filter(r => r.mail && r.mail.includes('@'))
    .map(r => ({
      mail: r.mail,
      line_user_id: r.line_user_id || '',
      membership_number: r.membership_number || '',
      nickname: r.user_name || '',
      is_username_unique: r.is_username_unique === '1.0',
      join_date: r.join_date || null,
      role: r.role === 'admin' ? 'admin' : 'user',
      avatar_url: r.user_image || '',
      banner_url: r.header_image || '',
      membership_status: r.membership_status || '',
      fav_artist_id: r.fav_artists_id || null,
      post_count: parseInt(r.post_count) || 0,
      approval_total: parseInt(r.approval_total) || 0,
      edit_report_count: parseInt(r.edit_report_count) || 0,
      ref_code: r.ref_code || null,
      introduced_by: r.introduced_by || '',
      is_verified: r.is_verified === '1.0',
    }))

  // プロフィールデータを一時テーブルに保存（Auth移行後に紐づけ）
  console.log(`  📋 ${users.length} user profiles prepared`)
  console.log('  ⚠️  Profiles will be linked after Supabase Auth migration')

  // JSON として保存（後で Auth ユーザー作成後に紐づけ）
  const { writeFileSync } = await import('fs')
  writeFileSync(
    resolve(__dirname, '..', 'data', 'glide-export', 'users-prepared.json'),
    JSON.stringify(users, null, 2),
    'utf-8'
  )
  console.log('  ✅ Saved to data/glide-export/users-prepared.json')
}

// ============================================================
// メイン実行
// ============================================================
async function main() {
  console.log('🚀 Connects+ Data Import')
  console.log(`   Supabase: ${url}`)
  console.log('')

  await importArtists()
  await importScheduleTags()
  await importSchedules()
  await importSpots()
  await importUsers()

  console.log('\n✨ Import complete!')
  console.log('')
  console.log('Next steps:')
  console.log('  1. Supabase Dashboard でデータを確認')
  console.log('  2. spots テーブルの genre を手動で設定')
  console.log('  3. Auth ユーザー作成後に profiles テーブルを紐づけ')
  console.log('  4. MY_CALENDER の移行は Auth 後に実施')
}

main().catch(console.error)
