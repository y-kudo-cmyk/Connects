import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: sp } = await s.from('spots').select('*').eq('id', 'SP00122').maybeSingle()
console.log('SP00122:', JSON.stringify(sp, null, 2))

const { data: ph } = await s.from('spot_photos').select('*').eq('spot_id', 'SP00122')
console.log('\nphotos:', ph)

// Test photo URL with HEAD fetch
for (const p of ph) {
  try {
    const res = await fetch(p.image_url, { method: 'HEAD' })
    console.log(`${p.image_url} → ${res.status}`)
  } catch (e) {
    console.log(`${p.image_url} → ERROR ${e.message}`)
  }
}
