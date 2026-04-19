import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

for (const pid of ['P_UN005', 'P_KR023', 'P_KR019']) {
  const { data: product } = await s.from('card_products').select('product_name').eq('product_id', pid).single()
  const { data: versions } = await s.from('card_versions').select('version_id, version_name').eq('product_id', pid).order('version_id')
  console.log(`\n=== ${pid} | ${product?.product_name} ===`)
  for (const v of versions || []) {
    const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.version_id)
    const isBase = !v.version_id.includes('BEN_') && !v.version_id.includes('LUCKY_')
    console.log(`  ${isBase ? '📦' : '🎁'} ${v.version_id} | ${v.version_name} | cards=${count}`)
  }
}
