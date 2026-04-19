// Concert/Event 系の card_products + versions + card_master を作成
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const MEMBER_NAMES = {
  A000001: 'S.COUPS', A000002: 'JEONGHAN', A000003: 'JOSHUA', A000004: 'JUN',
  A000005: 'HOSHI', A000006: 'WONWOO', A000007: 'WOOZI', A000008: 'THE 8',
  A000009: 'MINGYU', A000010: 'DK', A000011: 'SEUNGKWAN', A000012: 'VERNON', A000013: 'DINO',
}
const MEMBERS = Object.keys(MEMBER_NAMES)

// HANABI
const PRODUCT_ID = 'P_CON_HANABI'
const VERSION_ID = 'V_CON_HANABI_01'
const PRODUCT_NAME = `『SEVENTEEN 2022 JAPAN FANMEETING 'HANABI'』`

// 1. Product
const { data: existingProd } = await s.from('card_products').select('product_id').eq('product_id', PRODUCT_ID).maybeSingle()
if (!existingProd) {
  const { error } = await s.from('card_products').insert({
    product_id: PRODUCT_ID,
    product_name: PRODUCT_NAME,
    product_type: 'concert',
    region: 'EVENT',
    release_date: '2022-05-07',
    artist_id: 'SEVENTEEN',
    image_url: '',
  })
  if (error) console.error('product err:', error.message)
  else console.log(`✓ product ${PRODUCT_ID} ${PRODUCT_NAME}`)
}

// 2. Version
const { data: existingVer } = await s.from('card_versions').select('version_id').eq('version_id', VERSION_ID).maybeSingle()
if (!existingVer) {
  const { error } = await s.from('card_versions').insert({
    version_id: VERSION_ID,
    product_id: PRODUCT_ID,
    version_name: 'HANABI photocard',
    tier: 'INCLUDED',
    sort_order: 1,
  })
  if (error) console.error('ver err:', error.message)
  else console.log(`✓ version ${VERSION_ID}`)
}

// 3. card_master rows (13 members × 8 photocards)
const rows = []
for (const mid of MEMBERS) {
  for (let n = 1; n <= 8; n++) {
    rows.push({
      id: `CM_CON_HANABI_${mid}_${n}`,
      product_id: PRODUCT_ID,
      version_id: VERSION_ID,
      member_id: mid,
      member_name: MEMBER_NAMES[mid],
      card_type: 'photocard',
      card_detail: `Photocard ${n}`,
      front_image_url: '',
      back_image_url: '',
    })
  }
}
const { data: existing } = await s.from('card_master').select('id').in('id', rows.map(r => r.id))
const seen = new Set((existing || []).map(r => r.id))
const toInsert = rows.filter(r => !seen.has(r.id))
if (toInsert.length > 0) {
  const { error } = await s.from('card_master').insert(toInsert)
  if (error) console.error('insert err:', error.message)
  else console.log(`✓ ${toInsert.length} card_master rows inserted`)
} else {
  console.log('All card_master rows already exist')
}

console.log('\nDone.')
