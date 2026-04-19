// 全アルバムの INCLUDED 版構成を監査
// 期待: 通常版(複数) → CARAT → WEVERSE → KIT の順で全アルバム揃ってる
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: products } = await s.from('card_products')
  .select('product_id, product_name, region, release_date')
  .in('region', ['KR', 'JP'])
  .order('release_date', { ascending: false })

for (const p of products) {
  const { data: vers } = await s.from('card_versions').select('version_id, version_name, tier, sort_order').eq('product_id', p.product_id).or('tier.eq.INCLUDED,tier.is.null').order('sort_order')
  if (!vers || vers.length === 0) continue
  console.log(`\n${p.product_id} ${p.product_name} (${p.region}) ${p.release_date?.slice(0,10)}`)
  for (const v of vers) {
    const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.version_id)
    const hasWeverse = /weverse|WEVERSE/.test(v.version_name || '') || /weverse|WEVERSE/.test(v.version_id)
    const hasKit = /kit|KiT|KIT/.test(v.version_name || '') || /_07|_08|kit/i.test(v.version_id)
    const hasCarat = /carat|CARAT/.test(v.version_name || '')
    console.log(`  ${v.version_id.padEnd(20)} | ${(v.version_name || '').padEnd(30)} | sort=${v.sort_order} | ${count} cards`)
  }
  // Check for missing categories
  const names = (vers || []).map(v => (v.version_name || '').toLowerCase())
  const hasCarat = names.some(n => /carat/i.test(n))
  const hasWeverse = names.some(n => /weverse/i.test(n))
  const hasKit = names.some(n => /kit/i.test(n))
  const missing = []
  if (!hasCarat) missing.push('CARAT')
  if (!hasWeverse) missing.push('WEVERSE')
  if (!hasKit) missing.push('KIT')
  if (missing.length) console.log(`  ⚠ MISSING: ${missing.join(', ')}`)
}
