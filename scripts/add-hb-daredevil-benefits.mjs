import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PID = 'P_KR023'
// JEONGHAN (A000002) 除外
const MEMBERS = [
  { id: 'A000001', name: 'S.COUPS' },
  { id: 'A000003', name: 'JOSHUA' },
  { id: 'A000004', name: 'JUN' },
  { id: 'A000005', name: 'HOSHI' },
  { id: 'A000006', name: 'WONWOO' },
  { id: 'A000007', name: 'WOOZI' },
  { id: 'A000008', name: 'THE 8' },
  { id: 'A000009', name: 'MINGYU' },
  { id: 'A000010', name: 'DK' },
  { id: 'A000011', name: 'SEUNGKWAN' },
  { id: 'A000012', name: 'VERNON' },
  { id: 'A000013', name: 'DINO' },
]

const STORES = [
  { key: 'WEVERSE',  name: 'Weverse Shop' },
  { key: 'UMS',      name: 'UNIVERSAL MUSIC STORE' },
  { key: 'HMV',      name: 'HMV・Loppi' },
  { key: 'TOWER',    name: 'TOWER RECORDS' },
  { key: 'TSUTAYA',  name: 'TSUTAYA RECORDS' },
]

// バージョン投入: DAREDEVIL Ver. の店舗特典
const versions = STORES.map(st => ({
  version_id: `V_KR023_BEN_${st.key}_DAREDEVIL`,
  product_id: PID,
  version_name: `DAREDEVIL Ver. - ${st.name}`,
}))
await s.from('card_versions').upsert(versions, { onConflict: 'version_id' })
console.log(`versions upserted: ${versions.length}`)

// カード投入: 各版に 12人分のホログラムフォトカード
const cards = []
for (const st of STORES) {
  for (const [idx, m] of MEMBERS.entries()) {
    cards.push({
      id: `CM_KR023_BEN_${st.key}_DD_${idx + 1}`,
      product_id: PID,
      version_id: `V_KR023_BEN_${st.key}_DAREDEVIL`,
      member_id: m.id,
      member_name: m.name,
      card_type: 'photocard',
      card_detail: `DAREDEVIL Photocard (${m.name})`,
      front_image_url: '',
      back_image_url: '', // 画像URLが判明したら更新
    })
  }
}
await s.from('card_master').upsert(cards, { onConflict: 'id' })
console.log(`cards upserted: ${cards.length}`)

// 確認
const { data } = await s.from('card_versions').select('version_id, version_name').eq('product_id', PID).like('version_id', '%BEN%').order('version_id')
console.log('\nHB benefit versions:')
for (const v of data || []) console.log(`  ${v.version_id} | ${v.version_name}`)
