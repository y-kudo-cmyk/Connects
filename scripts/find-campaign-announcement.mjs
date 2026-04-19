import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Check announcements table
const { data: ann } = await s.from('announcements').select('*').or('title.ilike.%参戦%,title.ilike.%座席ビュー%,body.ilike.%参戦%,body.ilike.%座席ビュー%,title.ilike.%キャンペーン%')
console.log('== announcements matching 参戦/座席/キャンペーン ==')
for (const a of ann || []) {
  console.log(JSON.stringify({ id: a.id, pub: a.published, pri: a.priority, title: a.title, created_at: a.created_at }, null, 2))
}

// Try other tables that might have campaigns
for (const t of ['campaigns', 'promotions', 'user_campaigns', 'concert_campaigns']) {
  const { error } = await s.from(t).select('*').limit(1)
  console.log(`table ${t}: ${error ? 'N/A' : 'exists'}`)
}
