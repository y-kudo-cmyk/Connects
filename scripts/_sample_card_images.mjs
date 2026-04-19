import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const types = ['tear-off_poster', 'puzzle', 'scratch_card', 'id_card', 'white', 'green', 'fotocard']
for (const t of types) {
  const { data } = await s.from('card_master').select('card_type, card_detail, front_image_url').eq('card_type', t).limit(3)
  console.log(`\n== ${t} ==`)
  for (const d of data) console.log(`  ${d.card_detail || '—'}: ${d.front_image_url?.slice(0,120) || '(no url)'}`)
}
