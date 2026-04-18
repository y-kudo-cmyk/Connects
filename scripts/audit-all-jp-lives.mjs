import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await s.from('events')
  .select('id, event_title, sub_event_title, start_date, end_date, spot_name, cancelled')
  .eq('tag', 'LIVE').eq('country', 'JP')
  .order('start_date', { ascending: true })

console.log(`total LIVE/JP: ${data.length}\n`)

// group by tour (heuristic: strip trailing venue/address)
const normalize = (t) => t
  .replace(/[『「]/g, '')
  .replace(/[』」]/g, '')
  .replace(/\s*(京セラ|東京|幕張|バンテリン|みずほ|日産|ヤンマー|さいたま|Kアリーナ|ベルーナ|福岡|ナゴヤ|日本ガイシ|横浜|大阪|神奈川|Aichi Sky|中野|Online|豊洲).*/i, '')
  .trim()

const byTour = new Map()
for (const e of data) {
  const k = normalize(e.event_title)
  if (!byTour.has(k)) byTour.set(k, [])
  byTour.get(k).push(e)
}

for (const [tour, events] of [...byTour.entries()].sort((a, b) => a[1][0].start_date.localeCompare(b[1][0].start_date))) {
  console.log(`\n== ${tour} (${events.length}件) ==`)
  for (const e of events) {
    const dateStr = (e.start_date || '').slice(0,10)
    const cancelMark = e.cancelled ? ' 🚫CANCELLED' : ''
    console.log(`  ${dateStr} | ${e.spot_name || '-'} | ${e.sub_event_title || ''}${cancelMark}`)
  }
}
