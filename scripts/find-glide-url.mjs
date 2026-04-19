import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const needle = 'Drnu4eE5l65LqkDRMRtV'
console.log(`searching for: ${needle}\n`)

// url_submissions inspection
const { data: us } = await s.from('url_submissions').select('*').limit(5)
console.log('url_submissions cols:', us?.[0] ? Object.keys(us[0]) : 'empty')

// Search in url_submissions across any text field
const { data: usRows, error: usErr } = await s.from('url_submissions').select('*').or(`raw_text.ilike.%${needle}%,image_url.ilike.%${needle}%,source_url.ilike.%${needle}%`)
if (usErr) console.log('us err:', usErr.message)
console.log(`\nurl_submissions match: ${usRows?.length || 0}`)
for (const r of usRows || []) console.log(JSON.stringify(r, null, 2))

// Search in events.image_url / source_url
const { data: ev } = await s.from('events').select('id, event_title, image_url, source_url, submitted_by, created_at').or(`image_url.ilike.%${needle}%,source_url.ilike.%${needle}%`)
console.log(`\nevents match: ${ev?.length || 0}`)
for (const r of ev || []) console.log(JSON.stringify(r, null, 2))

// Search in my_entries
const { data: me } = await s.from('my_entries').select('id, user_id, event_title, image_url, source_url, created_at').or(`image_url.ilike.%${needle}%,source_url.ilike.%${needle}%`)
console.log(`\nmy_entries match: ${me?.length || 0}`)
for (const r of me || []) console.log(JSON.stringify(r, null, 2))

// Broader: search in any text col of spots/spot_photos for 2026-03-26 date
console.log('\n=== spots near 2026-03-26 (broader) ===')
const { data: spots } = await s.from('spots').select('id, spot_name, submitted_by, created_at, updated_at, image_url').or('created_at.gte.2026-03-25,updated_at.gte.2026-03-25').limit(50)
for (const sp of spots || []) {
  if ((sp.created_at || '').startsWith('2026-03') || (sp.updated_at || '').startsWith('2026-03')) {
    console.log(`  ${sp.id} | ${sp.spot_name} | by=${sp.submitted_by} | c=${sp.created_at?.slice(0,10)} u=${sp.updated_at?.slice(0,10)}`)
  }
}
