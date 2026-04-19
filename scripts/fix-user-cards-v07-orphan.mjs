import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// V_KR023_07 を参照している user_cards 行を確認
const { data: orphans } = await s.from('user_cards').select('id, user_id, card_master_id, version_id, member_id, quantity').eq('version_id', 'V_KR023_07')
console.log(`orphan user_cards (V_KR023_07): ${orphans.length}`)
for (const o of orphans) console.log(`  ${o.id} | user=${o.user_id.slice(0,8)} | card_master=${o.card_master_id} | member=${o.member_id}`)

// 各行の card_master_id から新しい version_id を引く
for (const o of orphans) {
  const { data: cm } = await s.from('card_master').select('version_id').eq('id', o.card_master_id).maybeSingle()
  if (cm?.version_id && cm.version_id !== o.version_id) {
    await s.from('user_cards').update({ version_id: cm.version_id }).eq('id', o.id)
    console.log(`  fixed ${o.id}: V_KR023_07 → ${cm.version_id}`)
  } else {
    // card_master も消えてる場合は KiT Ver(V_KR023_06) へ寄せる
    const { data: kitCard } = await s.from('card_master').select('id').eq('version_id', 'V_KR023_06').eq('member_id', o.member_id).limit(1).maybeSingle()
    if (kitCard) {
      await s.from('user_cards').update({ version_id: 'V_KR023_06', card_master_id: kitCard.id }).eq('id', o.id)
      console.log(`  fallback ${o.id}: → V_KR023_06 / card ${kitCard.id}`)
    }
  }
}

// verify
const { count } = await s.from('user_cards').select('*', { count: 'exact', head: true }).eq('version_id', 'V_KR023_07')
console.log(`\nremaining: ${count}`)
