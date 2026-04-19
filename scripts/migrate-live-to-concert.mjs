// events / my_entries / glide_my_entries の tag='LIVE' を 'CONCERT' に変更
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

for (const table of ['events', 'my_entries', 'glide_my_entries']) {
  const { count: before } = await s.from(table).select('*', { count: 'exact', head: true }).eq('tag', 'LIVE')
  console.log(`${table}: LIVE count before = ${before}`)
  if (before > 0) {
    const { error, count } = await s.from(table).update({ tag: 'CONCERT' }, { count: 'exact' }).eq('tag', 'LIVE')
    if (error) console.error(`  err: ${error.message}`)
    else console.log(`  ✓ updated ${count} rows`)
  }
}
