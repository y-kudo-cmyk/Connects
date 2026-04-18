import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Final sweep: any memo with Korean bracket pattern
const { data } = await s.from('spots').select('id, memo').or('memo.ilike.%[인스%,memo.ilike.%[SVT%,memo.ilike.%instagram story%')
let n = 0
for (const sp of data) {
  await s.from('spots').update({ memo: '' }).eq('id', sp.id)
  n++
}
console.log(`cleared: ${n}`)

// Final verify
const { count } = await s.from('spots').select('*', { count: 'exact', head: true }).or('memo.ilike.%[인스%,memo.ilike.%[SVT%,memo.ilike.%instagram story%')
console.log(`remaining: ${count}`)
