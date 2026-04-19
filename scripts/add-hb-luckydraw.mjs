import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PRODUCT = 'P_KR023'

const STORES = [
  { slug: 'WEVERSE', display: 'Weverse Shop' },
  { slug: 'UMS',     display: 'UNIVERSAL MUSIC STORE' },
  { slug: 'HMV',     display: 'HMV・Loppi' },
  { slug: 'TOWER',   display: 'TOWER RECORDS' },
  { slug: 'TSUTAYA', display: 'TSUTAYA RECORDS' },
]

// メンバー：S.COUPSの A000002 は除外（兵役中）
const MEMBER_IDS = [
  'A000001','A000003','A000004','A000005','A000006','A000007',
  'A000008','A000009','A000010','A000011','A000012','A000013',
]

// 1. Insert 5 LUCKY_DRAW versions (store-specific)
const versionRows = STORES.map((st) => ({
  version_id: `V_KR023_BEN_${st.slug}_LUCKY`,
  product_id: PRODUCT,
  version_name: `ラキドロ - ${st.display}`,
  tier: 'STORE_JP',
  sort_order: 0,
}))

// upsert versions
const { data: insertedVersions, error: vErr } = await s.from('card_versions').upsert(versionRows, { onConflict: 'version_id' }).select()
if (vErr) { console.error('version err:', vErr); process.exit(1) }
console.log(`versions upserted: ${insertedVersions.length}`)

// 2. Insert 60 empty card_master rows
const cardRows = []
for (const st of STORES) {
  for (const memberId of MEMBER_IDS) {
    cardRows.push({
      id: `L_KR023_BEN_${st.slug}_LUCKY_${memberId}`,
      product_id: PRODUCT,
      version_id: `V_KR023_BEN_${st.slug}_LUCKY`,
      member_id: memberId,
      card_type: 'luckydraw',
      card_detail: 'ラキドロ',
      front_image_url: null,
      back_image_url: null,
    })
  }
}

// upsert cards
const { data: insertedCards, error: cErr } = await s.from('card_master').upsert(cardRows, { onConflict: 'id' }).select('id')
if (cErr) { console.error('card err:', cErr); process.exit(1) }
console.log(`cards upserted: ${insertedCards.length}`)

// Verify
const { data: ver } = await s.from('card_versions').select('version_id, version_name, tier').eq('product_id', PRODUCT).ilike('version_name', '%ラキドロ%').order('version_id')
console.log('\nlucky draw versions:')
for (const v of ver) console.log(`  ${v.version_id} | tier=${v.tier} | ${v.version_name}`)
