import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

for (const pid of ['P_JP010', 'P_JP011', 'P_JP008', 'P_JP006', 'P_JP005', 'P_JP004', 'P_JP003']) {
  const { data: p } = await s.from('card_products').select('product_name').eq('product_id', pid).maybeSingle()
  const { data: versions } = await s.from('card_versions').select('version_id, version_name, tier, sort_order').eq('product_id', pid).order('sort_order')
  console.log(`\n== ${pid} ${p?.product_name} (${versions.length} versions) ==`)
  for (const v of versions) {
    const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.version_id)
    console.log(`  ${v.version_id} | tier=${v.tier} | ${v.version_name} | cards=${count}`)
  }
}
