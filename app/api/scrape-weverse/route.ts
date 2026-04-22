export const maxDuration = 300  // Apify 同期待ちで 60 秒だと不足 (Vercel Pro は 300 まで)

// ============================================================================
// TODO (次手の方針) — React SPA が mount しない問題が本実装でも解決しない場合:
//
// B. 内部API直叩き (本命候補)
//    Weverse の notice 画面は SPA なので、HTML パースではなく内部 JSON API を
//    直接叩く方が安定。候補エンドポイント:
//      - https://global.apis.naver.com/weverse/wevweb/v2.0/community/{communityId}/notices
//      - https://weverse.io/wapi/v2/notices?communityId={id}&hl=ja&appId=...
//    SEVENTEEN の communityId は要特定 (たぶん 14 or 10, wes_artistId=7 と対応)。
//    pageFunction 内で page.evaluate(async () => fetch(url, {credentials: 'include'}))
//    で JSON を取得する。
//    本実装 (A) で収集する consoleLogs / failedRequests / networkキャプチャ から
//    正しいエンドポイントを特定してから B に進むのが効率的。
//
// C. モバイル UA (軽量 SPA) 案
//    m.weverse.io/seventeen/notice?hl=ja に切り替える or
//    preNavigationHooks で iPhone Safari UA をセット:
//      await page.context().setExtraHTTPHeaders({
//        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ...'
//      })
//    モバイル版は Next.js バンドルが分離されていて、描画成功する可能性がある。
// ============================================================================

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
  const quickMode = request.nextUrl.searchParams.get('quick') === '1'
  const DEBUG_KEY = 'TEMP_DEBUG_WEVERSE_2026_0422'  // 検証後削除
  const authorized =
    (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
    debugKey === DEBUG_KEY
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // quick モード: 環境変数の有無だけ確認して即返す
  if (quickMode) {
    return NextResponse.json({
      quick: true,
      env: {
        APIFY_TOKEN: APIFY_TOKEN ? `set (len=${APIFY_TOKEN.length}, ${APIFY_TOKEN.slice(0, 12)}...)` : 'MISSING',
        WEVERSE_ACCESS_TOKEN: WEVERSE_ACCESS_TOKEN ? `set (len=${WEVERSE_ACCESS_TOKEN.length}, ${WEVERSE_ACCESS_TOKEN.slice(0, 12)}...)` : 'MISSING',
        WEVERSE_REFRESH_TOKEN: WEVERSE_REFRESH_TOKEN ? `set (len=${WEVERSE_REFRESH_TOKEN.length}, ${WEVERSE_REFRESH_TOKEN.slice(0, 12)}...)` : 'MISSING',
        WEVERSE_DEVICE_ID: WEVERSE_DEVICE_ID || 'default',
        CRON_SECRET: process.env.CRON_SECRET ? `set (len=${process.env.CRON_SECRET.length})` : 'MISSING',
      },
      note: 'Apify scrape はスキップ。本実行は ?debug=... のみ (quickパラメータ無し) で',
    })
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

  // 値のサニタイズ: 改行/タブ/制御文字 (Vercel 環境変数で混入しやすい)
  const sanitize = (v: string) => v.replace(/[\r\n\t\x00-\x1f\x7f]/g, '').trim()
  const ACCESS = sanitize(WEVERSE_ACCESS_TOKEN)
  const REFRESH = sanitize(WEVERSE_REFRESH_TOKEN)
  const DEVICE = sanitize(WEVERSE_DEVICE_ID)
  log.push(`Sanitized lengths: access=${ACCESS.length} refresh=${REFRESH.length} device=${DEVICE.length}`)

  // url 形式で addCookies に渡す (domain/path ペアより Chrome DevTools との相性が良い)
  type CookieArrItem = {name: string; value: string; url: string}
  const cookieArr: CookieArrItem[] = []
  const URL_BASE = 'https://weverse.io/'
  if (ACCESS) cookieArr.push({name: 'we2_access_token', value: ACCESS, url: URL_BASE})
  if (REFRESH) cookieArr.push({name: 'we2_refresh_token', value: REFRESH, url: URL_BASE})
  cookieArr.push({name: 'we2_device_id', value: DEVICE, url: URL_BASE})
  cookieArr.push({name: 'wes_artistId', value: '7', url: URL_BASE})
  // 文字列エスケープの代わりに base64 エンコードで安全に埋め込む
  const cookieArrB64 = Buffer.from(JSON.stringify(cookieArr)).toString('base64')
  log.push('Cookie count: ' + cookieArr.length)
  log.push('Cookie values check: ' + cookieArr.map(c => c.name + '=' + (c.value ? c.value.length + 'chars' : 'EMPTY')).join(', '))
  log.push('cookieArrB64 length: ' + cookieArrB64.length)

  const config = {
    startUrls: [{ url: 'https://weverse.io/seventeen/notice?hl=ja' }],
    pageFunction: [
      'async function pageFunction(context) {',
      '  const { page, request } = context;',
      '  const cookieErrors = (request.userData && request.userData.cookieErrors) || [];',
      // ── console / requestfailed リスナーを「最先頭」で登録して取りこぼし防止
      '  const consoleLogs = [];',
      '  const failedRequests = [];',
      '  try {',
      '    page.on("console", (msg) => {',
      '      try {',
      '        const entry = { type: msg.type(), text: String(msg.text()).slice(0, 500) };',
      '        if (consoleLogs.length < 200) consoleLogs.push(entry);',
      '      } catch(e) {}',
      '    });',
      '    page.on("requestfailed", (req) => {',
      '      try {',
      '        const f = req.failure();',
      '        const entry = { url: req.url().slice(0, 300), method: req.method(), resourceType: req.resourceType(), errorText: f ? f.errorText : "" };',
      '        if (failedRequests.length < 200) failedRequests.push(entry);',
      '      } catch(e) {}',
      '    });',
      '    page.on("pageerror", (err) => {',
      '      try {',
      '        const entry = { type: "pageerror", text: String(err && err.message || err).slice(0, 500) };',
      '        if (consoleLogs.length < 200) consoleLogs.push(entry);',
      '      } catch(e) {}',
      '    });',
      '  } catch(e) {}',
      '  await page.waitForTimeout(2000);',
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
      // ── React SPA の mount を短時間で見切る: #root に children が出るまで最大15秒
      '  let rootMounted = false;',
      '  try {',
      '    await page.waitForFunction(',
      '      () => {',
      '        const el = document.querySelector("#__next, #root, #app");',
      '        return !!(el && el.children && el.children.length > 0);',
      '      },',
      '      { timeout: 15000 }',
      '    );',
      '    rootMounted = true;',
      '  } catch(e) {}',
      // mount したら本文描画を 5 秒待つ。しなかったら即診断フェーズへ (粘らない)
      '  if (rootMounted) {',
      '    try { await page.waitForSelector("text=NOTICE", { timeout: 8000 }); } catch(e) {}',
      '    await page.waitForTimeout(3000);',
      '  }',
      '  const text = await page.evaluate(() => document.body.innerText);',
      '  const htmlLen = await page.evaluate(() => document.documentElement.outerHTML.length);',
      '  const pageTitle = await page.title();',
      '  const currentUrl = page.url();',
      '  const hasLoginForm = await page.evaluate(() => !!document.querySelector("input[type=password], [class*=Login]"));',
      // HTMLダンプ: React が描画を諦めた理由を調べる
      '  const bodyHtml = await page.evaluate(() => document.body.outerHTML.slice(0, 1500));',
      '  const rootHtml = await page.evaluate(() => { const el = document.querySelector("#__next, #root, #app"); return el ? el.outerHTML.slice(0, 800) : "NO_ROOT"; });',
      // navigator.webdriver の値を確認 (ヘッドレス検知)
      '  const webdriver = await page.evaluate(() => navigator.webdriver);',
      '  const userAgent = await page.evaluate(() => navigator.userAgent);',
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
      '  return { url: request.url, text, htmlLen, pageTitle, currentUrl, hasLoginForm, bodyHtml, rootHtml, webdriver, userAgent, cookiesAfter, cookieErrors, rootMounted, consoleLogs, failedRequests };',
      '}',
    ].join('\n'),
    proxyConfiguration: { useApifyProxy: true },
    // ページ遷移は 'load' イベントまで待つ (domcontentloaded だと script 読み込み中で返ってくる)
    gotoOptions: { waitUntil: 'load', timeout: 60000 },
    // preNavigationHooks: 個別に addCookies して失敗した Cookie 名をrequest.userData に残す
    // これで「どの Cookie が Invalid cookie fields で弾かれたか」が判明する
    preNavigationHooks: [
      '[async ({page, request}) => {',
      '  const cookies = JSON.parse(Buffer.from("' + cookieArrB64 + '", "base64").toString("utf8"));',
      '  request.userData = request.userData || {};',
      '  request.userData.cookieErrors = [];',
      '  for (const c of cookies) {',
      '    try {',
      '      await page.context().addCookies([c]);',
      '    } catch (e) {',
      '      request.userData.cookieErrors.push({ name: c.name, valueLen: (c.value||"").length, error: String(e && e.message || e) });',
      '    }',
      '  }',
      '}]',
    ].join('\n'),
    maxRequestsPerCrawl: 1,
  }
  log.push('preNavigationHooks preview: ' + config.preNavigationHooks.slice(0, 150))

  // デバッグ: pageFunctionの中身をログ
  log.push(`pageFunction preview: ${config.pageFunction?.slice(0, 200)}`)
  log.push(`Full config JSON length: ${JSON.stringify(config).length}`)
  // デバッグ: 設定内容をログ
  log.push(`APIFY_TOKEN: ${APIFY_TOKEN ? 'set (' + APIFY_TOKEN.slice(0, 10) + '...)' : 'MISSING'}`)
  log.push(`ACCESS_TOKEN: ${WEVERSE_ACCESS_TOKEN ? 'set (' + WEVERSE_ACCESS_TOKEN.slice(0, 20) + '...)' : 'MISSING'}`)
  log.push(`REFRESH_TOKEN: ${WEVERSE_REFRESH_TOKEN ? 'set (' + WEVERSE_REFRESH_TOKEN.slice(0, 20) + '...)' : 'MISSING'}`)
  log.push(`Cookie B64 length: ${cookieData.length}`)

  // Apify実行 — waitForFinish は仕様上 MAX 60 秒強で打ち切られるケースがあるため、
  // 短めで投げて "RUNNING/READY" なら手動ポーリングに切り替える。
  const apifyUrl = `https://api.apify.com/v2/acts/apify~playwright-scraper/runs?token=${APIFY_TOKEN}&waitForFinish=60`
  log.push(`Apify URL: ${apifyUrl.replace(APIFY_TOKEN, 'xxx')}`)

  const runRes = await fetch(apifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  let runData = await runRes.json()
  log.push(`Apify initial status: ${runData.data?.status}`)
  log.push(`Apify run ID: ${runData.data?.id}`)

  // ポーリング: 終端ステータスになるまで最大 180 秒待つ (maxDuration=300 に収まる範囲)
  const TERMINAL = ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT', 'TIMING-OUT']
  const POLL_DEADLINE = Date.now() + 180_000
  let pollCount = 0
  while (runData.data?.id && !TERMINAL.includes(runData.data?.status) && Date.now() < POLL_DEADLINE) {
    await new Promise(r => setTimeout(r, 5000))
    pollCount++
    const pollRes = await fetch(`https://api.apify.com/v2/actor-runs/${runData.data.id}?token=${APIFY_TOKEN}`)
    const pollData = await pollRes.json()
    if (pollData?.data) {
      runData = pollData
    }
  }
  log.push(`Apify poll count: ${pollCount}`)
  log.push(`Apify final status: ${runData.data?.status}`)
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
  log.push(`HTML length: ${items?.[0]?.htmlLen || 0}`)
  log.push(`Page title: ${items?.[0]?.pageTitle || ''}`)
  log.push(`Current URL: ${items?.[0]?.currentUrl || ''}`)
  log.push(`Has login form: ${items?.[0]?.hasLoginForm}`)
  log.push(`webdriver: ${items?.[0]?.webdriver}`)
  log.push(`userAgent: ${items?.[0]?.userAgent}`)
  log.push(`rootHtml: ${items?.[0]?.rootHtml || ''}`)
  log.push(`bodyHtml preview: ${items?.[0]?.bodyHtml || ''}`)
  log.push(`rootMounted: ${items?.[0]?.rootMounted}`)
  // ★ preNavigationHooks で addCookies が個別に失敗した場合のエラー
  if (items?.[0]?.cookieErrors?.length) {
    log.push('cookieErrors: ' + JSON.stringify(items[0].cookieErrors).slice(0, 800))
  }
  // ★ ページ内 console 出力 (React / Weverse SDK のエラー追跡)
  const consoleLogs = items?.[0]?.consoleLogs as Array<{type: string; text: string}> | undefined
  if (consoleLogs?.length) {
    log.push(`consoleLogs count: ${consoleLogs.length}`)
    for (const c of consoleLogs.slice(0, 50)) {
      log.push(`  [${c.type}] ${c.text}`)
    }
  } else {
    log.push('consoleLogs: (none)')
  }
  // ★ リソース読み込み失敗 (CSP / プロキシブロック / SW による reject 等の切り分け)
  const failedRequests = items?.[0]?.failedRequests as Array<{url: string; method: string; resourceType: string; errorText: string}> | undefined
  if (failedRequests?.length) {
    log.push(`failedRequests count: ${failedRequests.length}`)
    for (const f of failedRequests.slice(0, 50)) {
      log.push(`  [${f.resourceType}] ${f.method} ${f.url} -> ${f.errorText}`)
    }
  } else {
    log.push('failedRequests: (none)')
  }
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
    // デバッグ: 個別リクエストが失敗した場合の Apify ログを取得
    try {
      const logRes = await fetch(`https://api.apify.com/v2/actor-runs/${runData.data.id}/log?token=${APIFY_TOKEN}`)
      const apifyLog = await logRes.text()
      log.push(`Apify log (last 1500): ${apifyLog.slice(-1500)}`)
    } catch (e) {
      log.push('Failed to fetch Apify log: ' + (e as Error).message)
    }
    // リクエストキューからエラー詳細
    try {
      const rqRes = await fetch(`https://api.apify.com/v2/actor-runs/${runData.data.id}/request-queue/requests?token=${APIFY_TOKEN}`)
      const rqData = await rqRes.json()
      const first = rqData?.data?.items?.[0]
      if (first) {
        log.push(`Request errorMessages: ${JSON.stringify(first.errorMessages || []).slice(0, 800)}`)
      }
    } catch {}
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
