// P_KR023 Happy Burstday 店舗特典 通常盤 (NEWESCAPE/NEWMYSEL) に DINO フォトカード13 を追加
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const STORES = [
  { versionId: 'V_KR023_BEN_HMV_NEWESCAPEVerNEWMYSEL', store: 'HMV', label: 'フォトカード 13' },
  { versionId: 'V_KR023_BEN_TOWER_NEWESCAPEVerNEWMYSEL', store: 'TOWER', label: 'フォトカード 13' },
  { versionId: 'V_KR023_BEN_TSUTAYA_NEWESCAPEVerNEWMYSEL', store: 'TSUTAYA', label: 'フォトカード 13' },
  { versionId: 'V_KR023_BEN_UMS_NEWESCAPEVerNEWMYSEL', store: 'UMS', label: 'フォトカード 13' },
  { versionId: 'V_KR023_BEN_WEVERSE_NEWESCAPEVerNEWMYSEL', store: 'WEVERSE', label: 'ホログラム入りフォトカード 13' },
]

let added = 0
for (const st of STORES) {
  const id = `CM_KR023_BEN_${st.store}_NEWESCAPE_DINO`
  const { data: existing } = await s.from('card_master').select('id').eq('id', id).maybeSingle()
  if (existing) { console.log(`${st.store}: already exists`); continue }
  const { error } = await s.from('card_master').insert({
    id,
    product_id: 'P_KR023',
    version_id: st.versionId,
    member_id: 'A000013',
    member_name: 'DINO',
    card_type: 'photocard',
    card_detail: st.label,
    front_image_url: '',
    back_image_url: '',
  })
  if (error) { console.error(`  ${st.store} err: ${error.message}`); continue }
  console.log(`✓ ${st.store}: added DINO ${st.label}`)
  added++
}

// Verify DINO counts
const { count: dinoNow } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('product_id', 'P_KR023').eq('member_id', 'A000013')
const { count: scoupsNow } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('product_id', 'P_KR023').eq('member_id', 'A000001')
console.log(`\nAfter: DINO=${dinoNow}, SCOUPS=${scoupsNow} (should match)`)
console.log(`Added: ${added}`)
