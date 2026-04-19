import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// 1) V_JP010_03 限定C に user_cards あるか
const { data: uc, count } = await s.from('user_cards').select('*', { count: 'exact' }).eq('version_id', 'V_JP010_03')
console.log(`V_JP010_03 限定C user_cards: ${count ?? 0}`)

// 2) HAPPY BURSTDAY (P_KR023) のメンバー別カウント - JEONGHAN 欠けてるか
const { data } = await s.from('card_master').select('member_id, version_id').eq('product_id', 'P_KR023')
const perMember = new Map()
for (const c of data) perMember.set(c.member_id, (perMember.get(c.member_id) || 0) + 1)
console.log('\nP_KR023 Happy Burstday per member:')
for (let i = 1; i <= 13; i++) {
  const id = `A${String(i).padStart(6, '0')}`
  console.log(`  ${id}: ${perMember.get(id) || 0}`)
}

// 3) 他の KR albums も JEONGHAN チェック
const { data: prods } = await s.from('card_products').select('product_id, product_name').like('product_id', 'P_KR%').order('product_id', { ascending: false })
console.log('\nJEONGHAN check across Korean albums:')
for (const p of prods) {
  const { count: jhCount } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('product_id', p.product_id).eq('member_id', 'A000002')
  const { count: total } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('product_id', p.product_id)
  if (total > 0) console.log(`  ${p.product_id} ${p.product_name}: JEONGHAN=${jhCount}, total=${total}`)
}
