import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'

const toDelete = [
  'a98b5095-aa00-4018-a740-1b7382f43c26', // CxM DOUBLE UP — CARAT会場限定プレゼント 受取予約 (not a concert)
]

// Also find & delete entries with broken spot_name containing 開催日時 or 開催日程 or Online
const { data: broken } = await s.from('my_entries').select('id, event_title, sub_event_title, spot_name, start_date').eq('user_id', YUTA).eq('tag', 'LIVE')
for (const e of broken) {
  if (!e.spot_name) continue
  if (e.spot_name.includes('開催日時') || e.spot_name.includes('開催日程') || e.spot_name === 'Online') {
    console.log(`broken: ${(e.start_date || '').slice(0,10)} | ${e.spot_name} | ${e.event_title}`)
    toDelete.push(e.id)
  }
}

// Also POWER OF LOVE JAPAN EDITION (2021-11-18) with no spot
const { data: powerLove } = await s.from('my_entries').select('id, event_title, spot_name, start_date').eq('user_id', YUTA).eq('tag', 'LIVE').ilike('event_title', '%POWER OF LOVE%JAPAN EDITION%')
for (const e of powerLove) {
  console.log(`power-love: ${(e.start_date || '').slice(0,10)} | ${e.spot_name || '-'} | ${e.event_title}`)
  toDelete.push(e.id)
}

console.log(`\nTo delete: ${toDelete.length}件`)
if (toDelete.length) {
  const { error, count } = await s.from('my_entries').delete({ count: 'exact' }).in('id', toDelete)
  if (error) { console.error(error); process.exit(1) }
  console.log(`Deleted: ${count}`)
}
