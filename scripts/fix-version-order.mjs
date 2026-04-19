// 全 KR アルバムの INCLUDED 版 sort_order を 通常 → CARAT → Weverse → KIT に統一
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function classify(name) {
  const n = (name || '').toLowerCase()
  if (n.includes('carat') || n.includes('dear') || n.includes('daredevil')) return 'CARAT'
  if (n.includes('weverse')) return 'WEVERSE'
  if (n.includes('kit') || n === 'kit ver') return 'KIT'
  return 'MAIN'
}

const { data: prods } = await s.from('card_products').select('product_id, product_name').eq('region', 'KR')
for (const p of prods) {
  const { data: vers } = await s.from('card_versions').select('version_id, version_name, sort_order, tier').eq('product_id', p.product_id).or('tier.eq.INCLUDED,tier.is.null').order('sort_order')
  if (!vers?.length) continue

  // Classify each
  const mains = [], carat = [], weverse = [], kit = []
  for (const v of vers) {
    const cls = classify(v.version_name)
    if (cls === 'CARAT') carat.push(v)
    else if (cls === 'WEVERSE') weverse.push(v)
    else if (cls === 'KIT') kit.push(v)
    else mains.push(v)
  }

  const ordered = [...mains, ...carat, ...weverse, ...kit]
  let changes = 0
  for (let i = 0; i < ordered.length; i++) {
    const want = i + 1
    if (ordered[i].sort_order === want) continue
    const { error } = await s.from('card_versions').update({ sort_order: want }).eq('version_id', ordered[i].version_id)
    if (error) console.error(`  ${ordered[i].version_id} err: ${error.message}`)
    else changes++
  }
  if (changes > 0) console.log(`${p.product_id} ${p.product_name}: updated ${changes}`)
}
