import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// pull existing TICKET row for image_url / source_url
const { data: ref } = await s.from('events').select('image_url, source_url, artist_id').eq('id', '7303d8a1-27fe-4259-9df8-e9bc5bf5fb93').maybeSingle()
console.log('ref:', ref)

// Check schema: see an existing LIVE row shape
const { data: sample } = await s.from('events').select('*').eq('tag', 'LIVE').eq('country', 'JP').limit(1)
console.log('\nsample LIVE/JP event columns:', Object.keys(sample[0] || {}))

// Check if CxM LIVE already exists
const { data: existing } = await s.from('events').select('id, event_title, sub_event_title, start_date, spot_name').eq('tag', 'LIVE').eq('country', 'JP').ilike('event_title', '%CxM%DOUBLE UP%JAPAN%')
console.log('\nexisting CxM LIVE/JP rows:', existing.length)
for (const e of existing) console.log('  ', e)

const today = new Date().toISOString().slice(0,10)
console.log('today:', today)
