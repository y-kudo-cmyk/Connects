import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'

// LIVE エントリ全取得
const { data: entries } = await s.from('my_entries').select('id, event_id, event_title, spot_name, spot_address, start_date').eq('user_id', YUTA).eq('tag', 'LIVE')
console.log(`LIVE total: ${entries.length}`)

// event_idで該当eventsを取得してcountry確認
const eventIds = entries.map(e => e.event_id).filter(Boolean)
const { data: events } = await s.from('events').select('id, country').in('id', eventIds)
const countryMap = new Map(events.map(e => [e.id, e.country]))

const toDelete = []
for (const e of entries) {
  const country = e.event_id ? countryMap.get(e.event_id) : null
  // country が JP 以外
  if (country && country !== 'JP') {
    toDelete.push({ id: e.id, title: e.event_title, country, spot: e.spot_name })
  }
}

console.log(`\n海外公演 (削除対象): ${toDelete.length}件`)
for (const d of toDelete) console.log(`  [${d.country}] ${d.spot || '-'} | ${d.title}`)

if (toDelete.length) {
  const { error, count } = await s.from('my_entries').delete({ count: 'exact' }).in('id', toDelete.map(d => d.id))
  if (error) { console.error(error); process.exit(1) }
  console.log(`\nDeleted: ${count}`)
}
