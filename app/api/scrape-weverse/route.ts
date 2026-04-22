export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Scrape投稿者: 環境変数 SCRAPE_SUBMITTER_USER_ID（未設定ならadmin YUTAのIDにfallback）
const SCRAPE_SUBMITTER = process.env.SCRAPE_SUBMITTER_USER_ID || '86c91b90-0060-4a3d-bf10-d5c846604882'
const APIFY_TOKEN = process.env.APIFY_API_TOKEN!
const WEVERSE_ACCESS_TOKEN = process.env.WEVERSE_ACCESS_TOKEN || ''
const WEVERSE_REFRESH_TOKEN = process.env.WEVERSE_REFRESH_TOKEN!
const WEVERSE_DEVICE_ID = process.env.WEVERSE_DEVICE_ID || '0b8011ed-b279-4a31-9b30-c5883ab154fd'

// ── 重複チェック用 ──────────────────────────────────────────
function normalize(s: string): string {
  return s
    .replace(/\s+/g, '')
    .replace(/[''""「」『』【】〈〉《》（）()[\]]/g, '')
    .replace(/\[NOTICE\]\s*/i, '')
    .replace(/\[EVENT\]\s*/i, '')
    .toLowerCase()
}

// ── Weverse notice → タグ判定 ────────────────────────────────
function noticeToTag(title: string): string {
  if (title.includes('CONCERT') || title.includes('TOUR') || title.includes('FAN MEETING') || title.includes('FANMEETING')) return 'CONCERT'
  if (title.includes('ON STAGE')) return 'CONCERT'
  if (title.includes('音源発売') || title.includes('Album') || title.includes('발매')) return 'CD'
  if (title.includes('POP-UP') || title.includes('ポップアップ')) return 'POPUP'
  if (title.includes('MERCHANDISE') || title.includes('グッズ') || title.includes('商品')) return 'MERCH'
  if (title.includes('ライブビューイング') || title.includes('ストリーミング')) return 'LIVEVIEWING'
  if (title.includes('Light Stick') || title.includes('DIGITAL CODE')) return 'MERCH'
  return 'INFO'
}

// ── テキストからnotice記事を抽出 ──────────────────────────────
function parseNotices(text: string): { title: string; date: string }[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const notices: { title: string; date: string }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // [NOTICE] or [EVENT] で始まる行がタイトル
    if (line.startsWith('[NOTICE]') || line.startsWith('[EVENT]')) {
      // 次の行でnewやdateを探す
      let date = ''
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const dateMatch = lines[j].match(/(\d{4})\.(\d{2})\.(\d{2})/)
        if (dateMatch) {
          date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
          break
        }
      }
      if (date) {
        notices.push({ title: line, date })
      }
    }
  }

  return notices
}

// ── API Route ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const debugKey = request.nextUrl.searchParams.get('debug')
  const DEBUG_KEY = 'TEMP_DEBUG_WEVERSE_2026_0422'  // 検証後削除
  const authorized =
    (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
    debugKey === DEBUG_KEY
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!APIFY_TOKEN || !WEVERSE_REFRESH_TOKEN) {
    return NextResponse.json({ error: 'Missing APIFY_API_TOKEN or WEVERSE_REFRESH_TOKEN' }, { status: 500 })
  }

  const log: string[] = []

  // 1. Apify Playwright Scraper を実行
  // CookieをBase64エンコードしてpageFunction内でデコード → addCookies
  const cookieData = Buffer.from(JSON.stringify([
    {name: 'we2_access_token', value: WEVERSE_ACCESS_TOKEN, domain: '.weverse.io', path: '/', sameSite: 'None', secure: true},
    {name: 'we2_refresh_token', value: WEVERSE_REFRESH_TOKEN, domain: '.weverse.io', path: '/', sameSite: 'None', secure: true},
    {name: 'we2_device_id', value: WEVERSE_DEVICE_ID, domain: '.weverse.io', path: '/', sameSite: 'None', secure: true},
    {name: 'wes_artistId', value: '7', domain: '.weverse.io', path: '/', sameSite: 'None', secure: true},
  ])).toString('base64')

  // Cookieを安全にエスケープしてpreNavigationHooksに埋め込む
  const cookieArr: {name: string; value: string; domain: string; path: string}[] = []
  if (WEVERSE_ACCESS_TOKEN) cookieArr.push({name: 'we2_access_token', value: WEVERSE_ACCESS_TOKEN, domain: '.weverse.io', path: '/'})
  if (WEVERSE_REFRESH_TOKEN) cookieArr.push({name: 'we2_refresh_token', value: WEVERSE_REFRESH_TOKEN, domain: '.weverse.io', path: '/'})
  cookieArr.push({name: 'we2_device_id', value: WEVERSE_DEVICE_ID, domain: '.weverse.io', path: '/'})
  cookieArr.push({name: 'wes_artistId', value: '7', domain: '.weverse.io', path: '/'})
  const escapedCookies = JSON.stringify(cookieArr).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  log.push('Cookie count: ' + cookieArr.length)
  log.push('Cookie values check: ' + cookieArr.map(c => c.name + '=' + (c.value ? c.value.length + 'chars' : 'EMPTY')).join(', '))

  const config = {
    startUrls: [{ url: 'https://weverse.io/seventeen/notice?hl=ja' }],
    pageFunction: [
      'async function pageFunction(context) {',
      '  const { page, request } = context;',
      '  await page.waitForTimeout(3000);',
      '  try {',
      '    const buttons = await page.locator("button");',
      '    const count = await buttons.count();',
      '    for (let i = 0; i < count; i++) {',
      '      const text = await buttons.nth(i).innerText();',
      '      if (text.includes("すべて同意") || text.includes("同意")) {',
      '        await buttons.nth(i).click();',
      '        break;',
      '      }',
      '    }',
      '  } catch(e) {}',
      '  await page.waitForTimeout(12000);',
      '  const text = await page.evaluate(() => document.body.innerText);',
      // ★ デバッグ: refreshチェック用に weverse.io の Cookie を取得',
      '  let cookiesAfter = [];',
      '  try {',
      '    const ctx = page.context();',
      '    const all = await ctx.cookies();',
      '    cookiesAfter = all.filter(c => c.name.startsWith("we2_")).map(c => ({',
      '      name: c.name,',
      '      valuePreview: c.value ? c.value.slice(0, 30) + "..." : "",',
      '      valueLength: c.value ? c.value.length : 0,',
      '      expires: c.expires,',
      '    }));',
      '  } catch(e) {}',
      '  return { url: request.url, text, cookiesAfter };',
      '}',
    ].join('\n'),
    proxyConfiguration: { useApifyProxy: true },
    preNavigationHooks: '[async ({page}) => { await page.context().addCookies(JSON.parse("' + escapedCookies + '")); }]',
    maxRequestsPerCrawl: 1,
  }
  log.push('escapedCookies length: ' + escapedCookies.length)
  log.push('preNavigationHooks preview: ' + config.preNavigationHooks.slice(0, 100))

  // デバッグ: pageFunctionの中身をログ
  log.push(`pageFunction preview: ${config.pageFunction?.slice(0, 200)}`)
  log.push(`Full config JSON length: ${JSON.stringify(config).length}`)
  // デバッグ: 設定内容をログ
  log.push(`APIFY_TOKEN: ${APIFY_TOKEN ? 'set (' + APIFY_TOKEN.slice(0, 10) + '...)' : 'MISSING'}`)
  log.push(`ACCESS_TOKEN: ${WEVERSE_ACCESS_TOKEN ? 'set (' + WEVERSE_ACCESS_TOKEN.slice(0, 20) + '...)' : 'MISSING'}`)
  log.push(`REFRESH_TOKEN: ${WEVERSE_REFRESH_TOKEN ? 'set (' + WEVERSE_REFRESH_TOKEN.slice(0, 20) + '...)' : 'MISSING'}`)
  log.push(`Cookie B64 length: ${cookieData.length}`)

  // Apify実行
  const apifyUrl = `https://api.apify.com/v2/acts/apify~playwright-scraper/runs?token=${APIFY_TOKEN}&waitForFinish=180`
  log.push(`Apify URL: ${apifyUrl.replace(APIFY_TOKEN, 'xxx')}`)

  const runRes = await fetch(apifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  const runData = await runRes.json()

  log.push(`Apify status: ${runData.data?.status}`)
  log.push(`Apify run ID: ${runData.data?.id}`)
  log.push(`Apify statusMessage: ${runData.data?.statusMessage || 'none'}`)

  if (runData.data?.status !== 'SUCCEEDED') {
    // 失敗ログを取得
    if (runData.data?.id) {
      try {
        const logRes = await fetch(`https://api.apify.com/v2/actor-runs/${runData.data.id}/log?token=${APIFY_TOKEN}`)
        const apifyLog = await logRes.text()
        log.push(`Apify log (last 500): ${apifyLog.slice(-500)}`)
      } catch {}
    }
    return NextResponse.json({ log, inserted: 0 })
  }

  // 2. 結果を取得
  const datasetId = runData.data.defaultDatasetId
  const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`)
  const items = await itemsRes.json()

  log.push(`Dataset items: ${items?.length}`)
  log.push(`Text length: ${items?.[0]?.text?.length || 0}`)
  log.push(`Text preview: ${items?.[0]?.text?.slice(0, 200) || 'empty'}`)
  // ★ Cookie デバッグ情報 — refresh 動作確認用
  if (items?.[0]?.cookiesAfter) {
    log.push('cookiesAfter: ' + JSON.stringify(items[0].cookiesAfter))
    const accessAfter = items[0].cookiesAfter.find((c: any) => c.name === 'we2_access_token')
    if (accessAfter && WEVERSE_ACCESS_TOKEN) {
      const envPreview = WEVERSE_ACCESS_TOKEN.slice(0, 30) + '...'
      const afterPreview = accessAfter.valuePreview
      log.push(`access_token env vs after: ${envPreview === afterPreview ? 'SAME (no refresh)' : 'DIFFERENT (refresh happened!)'}`)
    }
  }

  if (!items?.[0]?.text) {
    log.push('No text content from Weverse')
    return NextResponse.json({ log, inserted: 0 })
  }

  // 3. notice記事をパース
  const notices = parseNotices(items[0].text)
  log.push(`Parsed ${notices.length} notices from Weverse`)

  // 4. 今日の記事だけフィルター
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const today = jst.toISOString().slice(0, 10)
  const todayNotices = notices.filter(n => n.date === today)
  log.push(`Today (${today}): ${todayNotices.length} notices`)

  if (todayNotices.length === 0) {
    return NextResponse.json({ log, inserted: 0 })
  }

  // 5. 既存イベントと重複チェック
  const { data: existing } = await supabase.from('events').select('event_title, start_date, source_url')
  const existingKeys = new Set<string>()
  for (const e of existing || []) {
    const d = e.start_date ? e.start_date.slice(0, 10) : ''
    existingKeys.add(`${normalize(e.event_title)}::${d}`)
  }

  // 6. 新規イベントを挿入
  const newEvents: Record<string, unknown>[] = []
  for (const notice of todayNotices) {
    const cleanTitle = notice.title.replace(/\[NOTICE\]\s*/i, '').replace(/\[EVENT\]\s*/i, '').trim()
    const key = `${normalize(cleanTitle)}::${notice.date}`
    if (existingKeys.has(key)) continue
    existingKeys.add(key)

    newEvents.push({
      tag: noticeToTag(notice.title),
      artist_id: 'A000000',
      event_title: cleanTitle,
      sub_event_title: '',
      start_date: `${notice.date}T00:00:00`,
      end_date: null,
      spot_name: '',
      country: 'KR',
      image_url: '',
      source_url: 'https://weverse.io/seventeen/notice',
      status: 'confirmed',
      verified_count: 3,
      related_artists: '',
      submitted_by: SCRAPE_SUBMITTER,
    })
  }

  let inserted = 0
  if (newEvents.length > 0) {
    const { error } = await supabase.from('events').insert(newEvents)
    if (error) log.push(`Insert error: ${error.message}`)
    else inserted = newEvents.length
  }

  log.push(`Inserted: ${inserted}`)
  return NextResponse.json({ log, inserted, total: notices.length })
}
