import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// memos with Korean/Japanese brackets from scraped sources
const patterns = ['%인스타그램%', '%SVT Record%', '%Instagram%', '%소스%', '%[인스%']

for (const pat of patterns) {
  const { data } = await s.from('spots').select('id, spot_name, memo, source_url').ilike('memo', pat).limit(200)
  console.log(`\n== spots.memo matching "${pat}" (${data.length}) ==`)
  for (const sp of data.slice(0, 15)) console.log(`  ${sp.id} | ${sp.spot_name} | memo="${sp.memo}"`)
  if (data.length > 15) console.log(`  ... +${data.length - 15} more`)
}

// same for spot_photos
const { data: photos } = await s.from('spot_photos').select('id, spot_id, caption, source_url').or('caption.ilike.%인스타그램%,caption.ilike.%SVT Record%').limit(50)
console.log(`\n== spot_photos.caption Korean/SVT: ${photos?.length || 0} ==`)
for (const p of photos || []) console.log(`  ${p.id} | spot=${p.spot_id} | caption="${p.caption}"`)

// count memos with "[" brackets
const { data: bracketMemos } = await s.from('spots').select('id, memo').ilike('memo', '%[%')
console.log(`\nspots.memo with "[...]" bracket: ${bracketMemos.length}`)
const sample = new Set()
for (const sp of bracketMemos.slice(0, 30)) sample.add(sp.memo?.slice(0, 60))
for (const s of sample) console.log(`  example: ${s}`)
