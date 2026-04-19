// card_products.image_url を対応するイベント画像で更新
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const MAPPING = [
  { productId: 'P_CON_HANABI', eventTitle: "『SEVENTEEN 2022 JAPAN FANMEETING 'HANABI'』" },
  { productId: 'P_CON_BETHESUN_KR', eventTitle: 'BE THE SUN World Tour IN SEOUL' },
  { productId: 'P_CON_INCOMPLETE', eventTitle: 'IN-COMPLETE' },
  { productId: 'P_CON_CARATLAND_7', eventTitle: '2023 SVT 7TH FAN MEETING SEVENTEEN in CARAT LAND' },
  { productId: 'P_CON_FOLLOW_JP', eventTitle: "『SEVENTEEN TOUR 'FOLLOW' TO JAPAN』" },
  { productId: 'P_CON_FOLLOW_AGAIN_KR', eventTitle: 'FOLLOW AGAIN IN SEOUL' },
  { productId: 'P_CON_LOVE', eventTitle: "『SEVENTEEN 2023 JAPAN FANMEETING 'LOVE'』" },
]

for (const m of MAPPING) {
  const { data: evt } = await s.from('events').select('image_url').eq('event_title', m.eventTitle).not('image_url', 'is', null).neq('image_url', '').limit(1)
  if (!evt?.[0]?.image_url) { console.log(`  ${m.productId}: no event image found`); continue }
  const { error } = await s.from('card_products').update({ image_url: evt[0].image_url }).eq('product_id', m.productId)
  if (error) console.error(`  ${m.productId} err: ${error.message}`)
  else console.log(`✓ ${m.productId} → ${evt[0].image_url.slice(0, 80)}`)
}
