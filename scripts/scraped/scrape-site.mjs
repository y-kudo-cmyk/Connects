// Scrape seventeen-17.jp discography + release-announcement posts for all SEVENTEEN CD releases.
// READ-ONLY. Writes reference HTML + a progress log. Does not touch Supabase.
//
// Usage:
//   node scripts/scraped/scrape-site.mjs
//
// Why a script at all? Most of the scraping was done by the Claude Code agent via
// WebFetch during this task (see store-benefits-report.json), but the live site
// has many discography detail pages that require raw HTML to discover slugs. This
// file lets the team re-run the full crawl later.

import { writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import * as cheerio from 'cheerio'

const OUT = new URL('./', import.meta.url).pathname.replace(/^\//, '') // windows path cleanup
const LOG = new URL('./scrape.log', import.meta.url)
const UA = 'Mozilla/5.0 (compatible; connects-plus-audit/1.0)'
const DELAY_MS = 300

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  process.stdout.write(line)
  appendFileSync(LOG, line)
}

async function fetchText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return await r.text()
}

async function fetchDiscographyList(category) {
  const out = []
  for (let page = 1; page <= 10; page++) {
    const url = `https://www.seventeen-17.jp/posts/discography?category=${encodeURIComponent(category)}&page=${page}`
    let html
    try { html = await fetchText(url) } catch (e) { log(`${category} p${page}: ${e.message}`); break }
    const $ = cheerio.load(html)
    const items = []
    $('dl').each((_, dl) => {
      const onclick = $(dl).attr('onclick') || ''
      const m = onclick.match(/\/posts\/discography\/([a-z0-9]+)/i)
      if (!m) return
      const slug = m[1]
      const img = $(dl).find('img').attr('src') || ''
      const dc = $(dl).find('.dc').text().trim()
      const dm = dc.match(/(\d{4}\.\d{1,2}\.\d{1,2})/)
      const title = $(dl).find('.title').text().trim()
      items.push({ slug, title, release_date: dm?.[1] || '', image: img, category })
    })
    if (!items.length) break
    out.push(...items)
    log(`${category} p${page}: ${items.length} items`)
    await sleep(DELAY_MS)
  }
  return out
}

async function fetchDiscographyDetail(slug) {
  const url = `https://www.seventeen-17.jp/posts/discography/${slug}`
  const html = await fetchText(url)
  const $ = cheerio.load(html)
  const versions = []
  $('h4, h3').each((_, h) => {
    const t = $(h).text().trim()
    if (/(Ver\.|VER\.|ver\.)/.test(t) && t.length < 80) versions.push(t)
  })
  // Heuristic: look for links to /posts/information/... to find announcement post
  const infoLinks = []
  $('a[href*="/posts/information/"]').each((_, a) => {
    const href = $(a).attr('href') || ''
    const m = href.match(/\/posts\/information\/([a-z0-9]+)/i)
    if (m) infoLinks.push(m[1])
  })
  return { slug, versions: [...new Set(versions)], info_links: [...new Set(infoLinks)], html_len: html.length }
}

async function searchAnnouncement(keyword) {
  // Paginate the /posts/information?keyword= search until we hit an empty page
  const hits = []
  for (let page = 1; page <= 5; page++) {
    const url = `https://www.seventeen-17.jp/posts/information?keyword=${encodeURIComponent(keyword)}&page=${page}`
    let html
    try { html = await fetchText(url) } catch (e) { log(`search ${keyword} p${page}: ${e.message}`); break }
    const $ = cheerio.load(html)
    let count = 0
    $('dl').each((_, dl) => {
      const onclick = $(dl).attr('onclick') || ''
      const m = onclick.match(/\/posts\/information\/([a-z0-9]+)/i)
      if (!m) return
      const slug = m[1]
      const title = $(dl).find('.title').text().trim()
      hits.push({ slug, title, keyword })
      count++
    })
    if (!count) break
    await sleep(DELAY_MS)
  }
  return hits
}

async function fetchAnnouncement(slug) {
  const url = `https://www.seventeen-17.jp/posts/information/${slug}`
  const html = await fetchText(url)
  // Save raw copy for manual review
  writeFileSync(new URL(`./raw/info_${slug}.html`, import.meta.url), html)
  return { slug, html_len: html.length }
}

// ------------ main ------------
if (!existsSync(new URL('./raw/', import.meta.url))) mkdirSync(new URL('./raw/', import.meta.url), { recursive: true })
log('start')

const discography = []
for (const cat of ['CD-KR-', 'CD-JP-']) {
  const list = await fetchDiscographyList(cat)
  discography.push(...list)
}
writeFileSync(new URL('./discography.json', import.meta.url), JSON.stringify(discography, null, 2))
log(`discography: ${discography.length} albums`)

const details = []
for (const item of discography) {
  try {
    const d = await fetchDiscographyDetail(item.slug)
    details.push({ ...item, ...d })
    log(`detail ${item.slug}: ${d.versions.length} versions, ${d.info_links.length} info_links`)
  } catch (e) {
    log(`detail ${item.slug}: ERR ${e.message}`)
    details.push({ ...item, error: e.message })
  }
  await sleep(DELAY_MS)
}
writeFileSync(new URL('./discography_detail.json', import.meta.url), JSON.stringify(details, null, 2))

// For each album with no info_link, try a keyword search
const announcements = {}
for (const d of details) {
  if (d.info_links?.length) { announcements[d.slug] = d.info_links; continue }
  const kw = (d.title || '').replace(/[「」『』\[\]]/g, '').split(' ').slice(-2).join(' ')
  if (!kw) continue
  try {
    const hits = await searchAnnouncement(kw)
    const release = hits.find(h => /発売決定|予約販売開始|店舗別|チェーン別/.test(h.title))
    if (release) announcements[d.slug] = [release.slug]
    log(`search ${kw}: ${hits.length} hits, pick=${release?.slug || '-'}`)
  } catch (e) { log(`search ${kw}: ERR ${e.message}`) }
  await sleep(DELAY_MS)
}
writeFileSync(new URL('./announcements.json', import.meta.url), JSON.stringify(announcements, null, 2))

// Save raw announcement HTML for all candidate slugs
for (const slugs of Object.values(announcements)) {
  for (const s of slugs) {
    try { await fetchAnnouncement(s); log(`fetched info ${s}`) }
    catch (e) { log(`info ${s}: ERR ${e.message}`) }
    await sleep(DELAY_MS)
  }
}

log('done')
