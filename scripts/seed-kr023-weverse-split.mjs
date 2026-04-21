// P_KR023 HB: Weverse を GB/JP 2リージョンに分割、DAREDEVIL に PostCard 追加
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const PID = 'P_KR023'
// JEONGHAN (A000002) は HB不在
const MEMBERS = [
  { id: 'A000001', name: 'S.COUPS' },
  { id: 'A000003', name: 'JOSHUA' },  { id: 'A000004', name: 'JUN' },
  { id: 'A000005', name: 'HOSHI' },   { id: 'A000006', name: 'WONWOO' },
  { id: 'A000007', name: 'WOOZI' },   { id: 'A000008', name: 'THE 8' },
  { id: 'A000009', name: 'MINGYU' },  { id: 'A000010', name: 'DK' },
  { id: 'A000011', name: 'SEUNGKWAN' },{ id: 'A000012', name: 'VERNON' },
  { id: 'A000013', name: 'DINO' },
]

// [1] 既存Weverse VERの name を GB 明記に
console.log('[1] Rename existing Weverse → Weverse GB')
await s.from('card_versions').update({ version_name: '通常 - Weverse Shop (GB)' }).eq('version_id', 'V_KR023_BEN_WEVERSE_NEWESCAPEVerNEWMYSEL')
await s.from('card_versions').update({ version_name: 'DAREDEVIL - Weverse Shop (GB)' }).eq('version_id', 'V_KR023_BEN_WEVERSE_DAREDEVIL')

// [2] Weverse JP 変種を新規追加
console.log('\n[2] Add Weverse JP VERs')
const JP_VERS = [
  { vid: 'V_KR023_BEN_WEVERSEJP_NEWESCAPEVerNEWMYSEL', name: '通常 - Weverse Shop (JP)',     detail: 'ホログラム入りフォトカード 1' },
  { vid: 'V_KR023_BEN_WEVERSEJP_DAREDEVIL',             name: 'DAREDEVIL - Weverse Shop (JP)', detail: 'DAREDEVIL Photocard (S.COUPS)' },
]
for (const v of JP_VERS) {
  await s.from('card_versions').upsert({
    version_id: v.vid, product_id: PID, version_name: v.name, tier: 'STORE_JP', sort_order: 0,
  }, { onConflict: 'version_id' })
  const rows = MEMBERS.map(m => ({
    id: `CM_${v.vid.replace('V_','')}_${m.id}`,
    product_id: PID, version_id: v.vid, member_id: m.id, member_name: m.name,
    card_type: 'photocard',
    card_detail: v.detail.replace('S.COUPS', m.name),
    front_image_url: '', back_image_url: '',
  }))
  await s.from('card_master').upsert(rows, { onConflict: 'id' })
  console.log(`  ${v.vid}: ${rows.length} cards`)
}

// [3] V_KR023_04 DAREDEVIL に PostCard 追加 (12メンバー分)
console.log('\n[3] Add PostCard to V_KR023_04 DAREDEVIL Ver.')
const postcardRows = MEMBERS.map(m => ({
  id: `CM_KR023_04_POSTCARD_${m.id}`,
  product_id: PID, version_id: 'V_KR023_04',
  member_id: m.id, member_name: m.name,
  card_type: 'postcard',
  card_detail: 'PostCard',
  front_image_url: '', back_image_url: '',
}))
await s.from('card_master').upsert(postcardRows, { onConflict: 'id' })
console.log(`  V_KR023_04 PostCard: ${postcardRows.length} cards`)

// Verify
const { count: total } = await s.from('card_master').select('id', { count: 'exact', head: true }).eq('product_id', PID)
console.log(`\nTotal P_KR023: ${total}`)
