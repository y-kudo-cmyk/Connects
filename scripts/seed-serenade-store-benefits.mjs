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

const PRODUCT_ID = 'P_UN005'
const DK = { id: 'A000010', name: 'DK' }
const SEUNGKWAN = { id: 'A000011', name: 'SEUNGKWAN' }

// N cards: 2種=DK+SK, 3種=DK+SK+DK (PC3 は暫定DK、正確な絵柄が判明したら修正)
function cardsForN(n) {
  if (n === 2) return [DK, SEUNGKWAN]
  if (n === 3) return [DK, SEUNGKWAN, DK] // PC3 is tentative
  return []
}

const BENEFITS = [
  // BLUE/ECHO Ver (共通特典)
  { id: 'BENEFIT_BE_WEVERSE',  name: 'BLUE/ECHO - Weverse Shop', count: 3, preview: 'https://contents.perfect.ne.jp/media/974caa/wnxwnu0ns6.jpg', ver_hint: 'BLUE/ECHO', benefit: 'Hologram Photocard' },
  { id: 'BENEFIT_BE_UMS',      name: 'BLUE/ECHO - UMS',          count: 3, preview: 'https://contents.perfect.ne.jp/media/974caa/5jig90h4mw.jpg', ver_hint: 'BLUE/ECHO', benefit: 'Special Photocard' },
  { id: 'BENEFIT_BE_HMV',      name: 'BLUE/ECHO - HMV/Loppi',    count: 2, preview: 'https://contents.perfect.ne.jp/media/974caa/fc4duaomwd.jpg', ver_hint: 'BLUE/ECHO', benefit: 'Special Photocard' },
  { id: 'BENEFIT_BE_TOWER',    name: 'BLUE/ECHO - Tower',        count: 2, preview: 'https://contents.perfect.ne.jp/media/974caa/eyim6f8xcl.jpg', ver_hint: 'BLUE/ECHO', benefit: 'Special Photocard' },
  { id: 'BENEFIT_BE_TSUTAYA',  name: 'BLUE/ECHO - TSUTAYA',      count: 2, preview: 'https://contents.perfect.ne.jp/media/974caa/csarku0rro.jpg', ver_hint: 'BLUE/ECHO', benefit: 'Special Photocard' },
  // COMPACT Ver
  { id: 'BENEFIT_CP_WEVERSE',  name: 'COMPACT - Weverse Shop',   count: 3, preview: 'https://contents.perfect.ne.jp/media/974caa/evzskndizc.jpg', ver_hint: 'COMPACT',   benefit: 'Hologram Photocard' },
  { id: 'BENEFIT_CP_UMS',      name: 'COMPACT - UMS',            count: 3, preview: 'https://contents.perfect.ne.jp/media/974caa/6impkxxsdt.jpg', ver_hint: 'COMPACT',   benefit: 'Special Photocard' },
  { id: 'BENEFIT_CP_HMV',      name: 'COMPACT - HMV/Loppi',      count: 2, preview: 'https://contents.perfect.ne.jp/media/974caa/12i1rmxist.jpg', ver_hint: 'COMPACT',   benefit: 'Special Photocard' },
  { id: 'BENEFIT_CP_TOWER',    name: 'COMPACT - Tower',          count: 2, preview: 'https://contents.perfect.ne.jp/media/974caa/nlf7t0gex6.jpg', ver_hint: 'COMPACT',   benefit: 'Special Photocard' },
  { id: 'BENEFIT_CP_TSUTAYA',  name: 'COMPACT - TSUTAYA',        count: 2, preview: 'https://contents.perfect.ne.jp/media/974caa/ixjofu2x8e.jpg', ver_hint: 'COMPACT',   benefit: 'Special Photocard' },
]

const versions = BENEFITS.map(b => ({
  version_id: `V_UN005_${b.id}`,
  product_id: PRODUCT_ID,
  version_name: b.name,
}))

const { error: vErr, count: vCount } = await supabase
  .from('card_versions')
  .upsert(versions, { onConflict: 'version_id', count: 'exact' })
if (vErr) { console.error('versions:', vErr); process.exit(1) }
console.log(`card_versions upserted: ${vCount}`)

const cards = []
let idx = 1
for (const b of BENEFITS) {
  const mems = cardsForN(b.count)
  for (let i = 0; i < mems.length; i++) {
    const m = mems[i]
    cards.push({
      id: `CM_UN005_${b.id}_${i + 1}`,
      product_id: PRODUCT_ID,
      version_id: `V_UN005_${b.id}`,
      member_id: m.id,
      member_name: m.name,
      card_type: 'photocard',
      card_detail: `${b.benefit} ${i + 1}`,
      front_image_url: '',
      back_image_url: b.preview,
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
const { count } = await supabase
  .from('card_master')
  .select('*', { count: 'exact', head: true })
  .eq('product_id', PRODUCT_ID)
console.log(`Total Serenade cards: ${count}`)
