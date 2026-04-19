// SEVENTEENTH HEAVEN 封入 3バージョン の 3枚目/4枚目:
// 3枚目 → minicard (同サイズ 2:3)
// 4枚目 → sticker  (1:1)
// 既存ID: CM_KR019_XX_027..052 (member毎に [3枚目, 4枚目] 連番)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const VERSIONS = ['V_KR019_01', 'V_KR019_02', 'V_KR019_03']
let updated = 0
for (const v of VERSIONS) {
  const { data } = await s.from('card_master').select('id').eq('version_id', v).gt('id', `CM_KR019_${v.slice(-2)}_026`)
  console.log(`\n${v}: ${data.length} new rows`)
  for (const r of data) {
    const seq = parseInt(r.id.slice(-3))
    // Sequence after 026: 027=A000001 slot3, 028=A000001 slot4, 029=A000002 slot3, ...
    // offset from 026: (seq-26); odd=slot3 (minicard), even=slot4 (sticker)
    const offset = seq - 26
    const isSlot3 = offset % 2 === 1
    const newType = isSlot3 ? 'minicard' : 'sticker'
    const newDetail = isSlot3 ? 'Minicard' : 'Sticker'
    const { error } = await s.from('card_master').update({
      card_type: newType,
      card_detail: newDetail,
    }).eq('id', r.id)
    if (error) { console.error(`  ${r.id}: ${error.message}`); continue }
    updated++
  }
  console.log(`  updated ${data.length} rows`)
}
console.log(`\nTotal updated: ${updated}`)

// Verify
for (const v of VERSIONS) {
  const { data } = await s.from('card_master').select('card_type, card_detail').eq('version_id', v).gt('id', `CM_KR019_${v.slice(-2)}_026`)
  const counts = new Map()
  for (const r of data) counts.set(r.card_type, (counts.get(r.card_type) || 0) + 1)
  console.log(`${v}: ${[...counts.entries()].map(([k,n])=>`${k}×${n}`).join(' / ')}`)
}
