import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const YKUDO = '65ba4bc6-917d-4689-aeaf-8d4b5b01a004'

const { data, error } = await supabase
  .from('user_cards')
  .select('*')
  .eq('user_id', YKUDO)
  .order('created_at', { ascending: false })

if (error) { console.error(error); process.exit(1) }
console.log(`user_cards count for y-kudo: ${data.length}`)
for (const r of data) {
  console.log(JSON.stringify({
    id: r.id,
    status: r.status,
    product_id: r.product_id,
    version_id: r.version_id,
    member_name: r.member_name,
    card_master_id: r.card_master_id,
    has_front: !!r.front_image_url,
    has_back: !!r.back_image_url,
    quantity: r.quantity,
    created_at: r.created_at,
  }))
}
