import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: products } = await s.from('card_products').select('product_id, product_name, release_date').order('release_date', { ascending: false })

for (const p of products || []) {
  const { data: versions } = await s.from('card_versions').select('version_id, version_name, tier').eq('product_id', p.product_id)
  const tierCounts = {}
  let totalCards = 0
  for (const v of versions || []) {
    tierCounts[v.tier || 'NULL'] = (tierCounts[v.tier || 'NULL'] || 0) + 1
    const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.version_id)
    totalCards += count || 0
  }
  const summary = Object.entries(tierCounts).map(([t, c]) => `${t}:${c}`).join(' ')
  console.log(`${p.product_id.padEnd(8)} | ${p.product_name.padEnd(30)} | V${(versions || []).length.toString().padStart(2)} C${String(totalCards).padStart(3)} | ${summary}`)
}
