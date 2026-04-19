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

const PRODUCT_ID = 'P_UN005' // DxS - Serenade
const DK = { id: 'A000010', name: 'DK' }
const SEUNGKWAN = { id: 'A000011', name: 'SEUNGKWAN' }

const STORES = [
  { version_id: 'V_UN005_LUCKY_HMV',     name: 'LUCKY DRAW - HMV',     preview: 'https://contents.perfect.ne.jp/media/974caa/nwl1iski8e.jpg' },
  { version_id: 'V_UN005_LUCKY_TOWER',   name: 'LUCKY DRAW - Tower',   preview: 'https://contents.perfect.ne.jp/media/974caa/ved6t0m6kn.jpg' },
  { version_id: 'V_UN005_LUCKY_TSUTAYA', name: 'LUCKY DRAW - TSUTAYA', preview: 'https://contents.perfect.ne.jp/media/974caa/d1aoegrx6p.jpg' },
]

const versions = STORES.map(s => ({
  version_id: s.version_id,
  product_id: PRODUCT_ID,
  version_name: s.name,
}))

const { error: vErr, count: vCount } = await supabase
  .from('card_versions')
  .upsert(versions, { onConflict: 'version_id', count: 'exact' })
if (vErr) { console.error('versions:', vErr); process.exit(1) }
console.log(`card_versions upserted: ${vCount}`)

// Cards: per store, 2 photocards (DK + SEUNGKWAN) — hologram
const cards = []
let idx = 1
for (const store of STORES) {
  for (const member of [DK, SEUNGKWAN]) {
    cards.push({
      id: `CM_UN005_LUCKY_${String(idx).padStart(3, '0')}`,
      product_id: PRODUCT_ID,
      version_id: store.version_id,
      member_id: member.id,
      member_name: member.name,
      card_type: 'photocard',
      card_detail: `Hologram Photocard (${member.name})`,
      front_image_url: '',
      back_image_url: store.preview, // 店舗プレビュー画像を暫定で裏面に（必要なら後で差替）
    })
    idx++
  }
}

const { error: cErr, count: cCount } = await supabase
  .from('card_master')
  .upsert(cards, { onConflict: 'id', count: 'exact' })
if (cErr) { console.error('cards:', cErr); process.exit(1) }
console.log(`card_master upserted: ${cCount}`)

// Verify
const { data: verify } = await supabase
  .from('card_master')
  .select('id, version_id, member_name, card_detail')
  .eq('product_id', PRODUCT_ID)
  .order('id')
console.log('')
console.log('Serenade cards:')
for (const r of verify || []) console.log(`  ${r.id} | ${r.version_id} | ${r.member_name} | ${r.card_detail}`)
