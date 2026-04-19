import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const event = {
  tag: 'POPUP',
  artist_id: 'A000000',
  related_artists: 'A000012', // VERNON
  event_title: '成分エディター POPUP「POP UP D-DAY」',
  sub_event_title: 'VERNON / HMV&BOOKS SHIBUYA',
  start_date: '2026-04-18T10:00:00+09:00',
  end_date: '2026-04-22T21:00:00+09:00',
  spot_name: 'HMV&BOOKS SHIBUYA (渋谷モディ6F)',
  spot_address: '東京都渋谷区神南1丁目21-3',
  country: 'JP',
  image_url: '',
  source_url: 'https://x.com/sungboon_jp/status/2045276120522928532?s=20',
  notes: '営業時間 10:00〜21:00 / 期間限定POPUP',
  status: 'pending',
  verified_count: 0,
}

const { data, error } = await supabase.from('events').insert(event).select().single()
if (error) { console.error('Insert failed:', error); process.exit(1) }

console.log('Inserted:')
console.log(JSON.stringify(data, null, 2))
