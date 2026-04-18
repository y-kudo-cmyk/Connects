import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: versions } = await s.from('card_versions').select('*').eq('product_id', 'P_JP002').order('sort_order')
console.log(`P_JP002 WE MAKE YOU versions: ${versions.length}\n`)
for (const v of versions) {
  const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.version_id)
  console.log(`  ${v.version_id} | tier=${v.tier} | sort=${v.sort_order} | ${v.version_name} | cards=${count}`)
}
