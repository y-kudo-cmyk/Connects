// Restore scraped "source hint" memos that were accidentally cleared.
//
// Strategy:
//   1. Build lookup tables from local source files:
//        - svt_tweets.json          : status_id / url  -> tweet object (full_text, created_at, ...)
//        - svt_tweet_spots.json     : spot name + url (parsed SEVENTEEN-loves spots)
//        - oshikatsu_tweets.json    : url -> tweet object
//        - oshikatsu_spots.json     : name + url
//        - oshito_spots.json        : spotName + url + title ("[... member][...] name")
//   2. For each DB spot where memo is empty, try to match by:
//        a. Normalized source_url (best)
//        b. Normalized spot_name
//      Only when the spot matches one of the SCRAPED sources do we write a memo;
//      spots that match nothing are left alone.
//   3. Hint format (mirrors the examples the user provided):
//        - tweet-based sources => `<first line of full_text, trimmed> (<Day Mon DD>)`
//        - oshito-only sources => `<title>` (e.g. ［SEVENTEEN ミンギュ］［東京］東京タワー)
//   4. Never overwrite a non-empty memo. Never touch any other column.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// --- env loader (mirrors clear-scraped-memos.mjs) ---
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// --- helpers ---
function normName(s) {
  if (!s) return ''
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, '')
    .replace(/[()（）「」『』\[\]［］【】\-·・、。,.]/g, '')
    .toLowerCase()
}

function normUrl(u) {
  if (!u) return ''
  // strip trailing slashes, querystring, whitespace, protocol differences
  let s = String(u).trim().toLowerCase()
  s = s.replace(/^https?:\/\/(www\.)?/, '')
  s = s.replace(/[?#].*$/, '')
  s = s.replace(/\/+$/, '')
  // normalize twitter/x domain
  s = s.replace(/^twitter\.com\//, 'x.com/')
  return s
}

function statusIdFromUrl(u) {
  if (!u) return null
  const m = String(u).match(/status\/(\d+)/)
  return m ? m[1] : null
}

// created_at is in Twitter format: "Thu Apr 09 08:37:42 +0000 2026"
function shortDayFromCreatedAt(s) {
  if (!s) return ''
  const m = String(s).match(/^([A-Za-z]{3}) ([A-Za-z]{3}) (\d{2})/)
  if (!m) return ''
  return `${m[1]} ${m[2]} ${m[3]}`
}

function firstLineOfTweet(full_text) {
  if (!full_text) return ''
  let line = String(full_text).split('\n')[0]
  // drop trailing t.co url if any
  line = line.replace(/\s*https?:\/\/t\.co\/\S+\s*$/, '')
  // HTML entity unescape for &amp;
  line = line.replace(/&amp;/g, '&')
  return line.trim()
}

function buildHintFromTweet(tweet) {
  if (!tweet) return ''
  const head = firstLineOfTweet(tweet.full_text)
  if (!head) return ''
  const day = shortDayFromCreatedAt(tweet.created_at)
  return day ? `${head} (${day})` : head
}

// --- load sources ---
const readJson = (rel) =>
  JSON.parse(readFileSync(new URL(`../scripts/${rel}`, import.meta.url), 'utf8'))

const svtTweets = readJson('svt_tweets.json')
const svtTweetSpots = readJson('svt_tweet_spots.json')
const oshiTweets = readJson('oshikatsu_tweets.json')
const oshiSpots = readJson('oshikatsu_spots.json')
const oshitoSpots = readJson('oshito_spots.json')

// Index tweets by status_id and by normalized url
const tweetByStatusId = new Map()
const tweetByUrl = new Map()
for (const t of [...svtTweets, ...oshiTweets]) {
  const sid = t.id || statusIdFromUrl(t.url)
  if (sid) tweetByStatusId.set(String(sid), t)
  if (t.url) tweetByUrl.set(normUrl(t.url), t)
}

// Index parsed-spot entries by normalized name and by normalized url.
// Each entry records {sourceFile, url, name, date}
const parsedSpotByName = new Map() // normName(name) -> {sourceFile, url, ...}
const parsedSpotByUrl = new Map()  // normUrl(url)   -> {...}

function addParsedSpot(entry, sourceFile) {
  const rec = { ...entry, sourceFile }
  if (entry.name) {
    const key = normName(entry.name)
    if (key && !parsedSpotByName.has(key)) parsedSpotByName.set(key, rec)
  }
  if (entry.url) {
    const key = normUrl(entry.url)
    if (key && !parsedSpotByUrl.has(key)) parsedSpotByUrl.set(key, rec)
  }
}
for (const e of svtTweetSpots) addParsedSpot(e, 'svt_tweet_spots.json')
for (const e of oshiSpots)     addParsedSpot({ ...e, name: e.name }, 'oshikatsu_spots.json')

// oshito has spotName + title
const oshitoByName = new Map()
const oshitoByUrl = new Map()
for (const e of oshitoSpots) {
  const rec = { ...e, sourceFile: 'oshito_spots.json' }
  if (e.spotName) {
    const key = normName(e.spotName)
    if (key && !oshitoByName.has(key)) oshitoByName.set(key, rec)
  }
  if (e.url) {
    const key = normUrl(e.url)
    if (key && !oshitoByUrl.has(key)) oshitoByUrl.set(key, rec)
  }
}

// --- pull DB spots (we only need those with empty memo) ---
console.log('Loading spots from DB ...')
const { data: allSpots, error: selErr } = await sb
  .from('spots')
  .select('id, spot_name, source_url, memo')
if (selErr) { console.error('DB error:', selErr); process.exit(1) }

const candidates = allSpots.filter(s => !s.memo || !String(s.memo).trim())
console.log(`Total spots: ${allSpots.length}`)
console.log(`Spots with empty memo (candidates): ${candidates.length}`)

// --- match + restore ---
const summary = {
  total_scanned: candidates.length,
  restored: 0,
  skipped_no_match: 0,
  skipped_no_hint: 0,
  by_source: {
    svt_tweets: 0,
    svt_tweet_spots_then_tweet: 0,
    oshikatsu_tweets: 0,
    oshikatsu_spots_then_tweet: 0,
    oshito_spots: 0,
  },
}

const samples = [] // {id, name, before, after, source}

function resolveHintForSpot(sp) {
  const nSource = normUrl(sp.source_url)
  const nName = normName(sp.spot_name)

  // 1) direct tweet url match -> use tweet first line
  if (nSource) {
    const t = tweetByUrl.get(nSource)
    if (t) {
      const hint = buildHintFromTweet(t)
      if (hint) {
        const isSvt = /svt_loves___/.test(t.url || '')
        return { hint, src: isSvt ? 'svt_tweets' : 'oshikatsu_tweets', tweet: t }
      }
    }
    // try via status_id extracted from spots.source_url
    const sid = statusIdFromUrl(sp.source_url)
    if (sid) {
      const t2 = tweetByStatusId.get(sid)
      if (t2) {
        const hint = buildHintFromTweet(t2)
        if (hint) {
          const isSvt = /svt_loves___/.test(t2.url || '')
          return { hint, src: isSvt ? 'svt_tweets' : 'oshikatsu_tweets', tweet: t2 }
        }
      }
    }
  }

  // 2) parsed-spot match by url -> lookup its tweet by same url
  if (nSource && parsedSpotByUrl.has(nSource)) {
    const p = parsedSpotByUrl.get(nSource)
    const t = tweetByUrl.get(normUrl(p.url))
    if (t) {
      const hint = buildHintFromTweet(t)
      if (hint) {
        const src = p.sourceFile === 'svt_tweet_spots.json'
          ? 'svt_tweet_spots_then_tweet'
          : 'oshikatsu_spots_then_tweet'
        return { hint, src, tweet: t }
      }
    }
  }

  // 3) parsed-spot match by name
  if (nName && parsedSpotByName.has(nName)) {
    const p = parsedSpotByName.get(nName)
    const t = tweetByUrl.get(normUrl(p.url))
    if (t) {
      const hint = buildHintFromTweet(t)
      if (hint) {
        const src = p.sourceFile === 'svt_tweet_spots.json'
          ? 'svt_tweet_spots_then_tweet'
          : 'oshikatsu_spots_then_tweet'
        return { hint, src, tweet: t }
      }
    }
  }

  // 4) oshito by url
  if (nSource && oshitoByUrl.has(nSource)) {
    const p = oshitoByUrl.get(nSource)
    if (p.title) return { hint: String(p.title).trim(), src: 'oshito_spots', oshito: p }
  }

  // 5) oshito by name
  if (nName && oshitoByName.has(nName)) {
    const p = oshitoByName.get(nName)
    if (p.title) return { hint: String(p.title).trim(), src: 'oshito_spots', oshito: p }
  }

  return null
}

const planned = []

for (const sp of candidates) {
  const resolved = resolveHintForSpot(sp)
  if (!resolved) { summary.skipped_no_match++; continue }
  if (!resolved.hint) { summary.skipped_no_hint++; continue }
  planned.push({ sp, ...resolved })
}

console.log(`Planned restorations: ${planned.length}`)

// Apply updates — one-by-one to be safe
for (const p of planned) {
  const { sp, hint, src } = p
  const { error } = await sb.from('spots')
    .update({ memo: hint })
    .eq('id', sp.id)
    .eq('memo', '') // extra guard: only if still empty
  if (error) {
    console.error(`  update failed ${sp.id} (${sp.spot_name}):`, error.message)
    continue
  }
  summary.restored++
  summary.by_source[src] = (summary.by_source[src] || 0) + 1
  if (samples.length < 5) {
    samples.push({
      id: sp.id,
      name: sp.spot_name,
      before: sp.memo ?? '',
      after: hint,
      source: src,
    })
  }
}

// Re-check the scraped-pattern memos after restore
const { count: restoredPatternCount } = await sb.from('spots')
  .select('*', { count: 'exact', head: true })
  .or('memo.ilike.%[인스%,memo.ilike.%SVT Record%,memo.ilike.%[위버스%,memo.ilike.%[하니%,memo.ilike.%[GOING SEVENTEEN%')

// --- Report ---
console.log('\n===== RESTORATION SUMMARY =====')
console.log(`total scanned : ${summary.total_scanned}`)
console.log(`restored      : ${summary.restored}`)
console.log(`skipped (no match) : ${summary.skipped_no_match}`)
console.log(`skipped (no hint)  : ${summary.skipped_no_hint}`)
console.log(`spots now matching scraped-memo patterns in DB : ${restoredPatternCount}`)
console.log('\nby source file:')
for (const [k, v] of Object.entries(summary.by_source)) {
  console.log(`  ${k.padEnd(30)} : ${v}`)
}

console.log('\nsample before/after (up to 5):')
for (const s of samples) {
  console.log('--------')
  console.log(`  id     : ${s.id}`)
  console.log(`  name   : ${s.name}`)
  console.log(`  source : ${s.source}`)
  console.log(`  before : ${JSON.stringify(s.before)}`)
  console.log(`  after  : ${JSON.stringify(s.after)}`)
}
