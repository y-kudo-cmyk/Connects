// P_JP006 ひとりじゃない の DB 整備:
// 1) 重複 V_JP006_05 (限定C dup) を削除
// 2) tier の legacy 数値 '1' を 'INCLUDED' に統一、sort_order 振り直し
// 3) 通常 → 通常盤 にリネーム
// 4) 欠けている VER (CARAT盤 / M∞CARD / 店舗特典) を追加
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const PID = 'P_JP006'
const MEMBERS = [
  { id: 'A000001', name: 'S.COUPS' }, { id: 'A000002', name: 'JEONGHAN' },
  { id: 'A000003', name: 'JOSHUA' },  { id: 'A000004', name: 'JUN' },
  { id: 'A000005', name: 'HOSHI' },   { id: 'A000006', name: 'WONWOO' },
  { id: 'A000007', name: 'WOOZI' },   { id: 'A000008', name: 'THE 8' },
  { id: 'A000009', name: 'MINGYU' },  { id: 'A000010', name: 'DK' },
  { id: 'A000011', name: 'SEUNGKWAN' },{ id: 'A000012', name: 'VERNON' },
  { id: 'A000013', name: 'DINO' },
]

// ── Safety check ──────────────────────────────
const { count: ucCount } = await s.from('user_cards').select('id', { count: 'exact', head: true }).eq('product_id', PID)
if ((ucCount ?? 0) > 0) {
  console.error(`ABORT: user_cards has ${ucCount} rows for ${PID}`); process.exit(1)
}
console.log(`[safety] user_cards for ${PID} = 0`)

// ── Step 1: delete duplicate V_JP006_05 ───────
console.log('\n[1] Delete V_JP006_05 (duplicate 限定C)')
await s.from('card_master').delete().eq('version_id', 'V_JP006_05')
await s.from('card_versions').delete().eq('version_id', 'V_JP006_05')

// ── Step 2: standardize existing versions ─────
console.log('\n[2] Standardize tier + sort_order + names')
const UPDATES = [
  { version_id: 'V_JP006_01', patch: { version_name: '限定A',   tier: 'INCLUDED', sort_order: 1 } },
  { version_id: 'V_JP006_02', patch: { version_name: '限定B',   tier: 'INCLUDED', sort_order: 2 } },
  { version_id: 'V_JP006_03', patch: { version_name: '限定C',   tier: 'INCLUDED', sort_order: 3 } },
  { version_id: 'V_JP006_06', patch: { version_name: '限定D',   tier: 'INCLUDED', sort_order: 4 } },
  { version_id: 'V_JP006_04', patch: { version_name: '通常盤',  tier: 'INCLUDED', sort_order: 5 } },
]
for (const u of UPDATES) {
  const { error } = await s.from('card_versions').update(u.patch).eq('version_id', u.version_id)
  if (error) console.error(`  ${u.version_id}: ${error.message}`); else console.log(`  ${u.version_id} → ${u.patch.version_name}`)
}

// ── Step 3: set card_detail to "PhotoCard" on existing cards ─────
console.log('\n[3] Fill card_detail for existing cards')
for (const u of UPDATES) {
  await s.from('card_master').update({ card_detail: 'PhotoCard' }).eq('product_id', PID).eq('version_id', u.version_id).is('card_detail', null)
}

// ── Step 4: add INCLUDED CARAT盤 + M∞CARD ─────
console.log('\n[4] Add INCLUDED: CARAT盤 / M∞CARD')
const newIncluded = [
  { version_id: 'V_JP006_07', version_name: 'CARAT盤',  detail: 'PhotoCard', type: 'photocard',  sort: 6 },
  { version_id: 'V_JP006_08', version_name: 'M∞CARD',   detail: 'M∞CARD',    type: 'photocard',  sort: 7 },
]
for (const v of newIncluded) {
  await s.from('card_versions').upsert({ version_id: v.version_id, product_id: PID, version_name: v.version_name, tier: 'INCLUDED', sort_order: v.sort }, { onConflict: 'version_id' })
  const rows = MEMBERS.map(m => ({
    id: `CM_JP006_${String(v.sort).padStart(2,'0')}_PHOTO_${m.id}`,
    product_id: PID, version_id: v.version_id, member_id: m.id, member_name: m.name,
    card_type: v.type, card_detail: v.detail, front_image_url: '', back_image_url: '',
  }))
  await s.from('card_master').upsert(rows, { onConflict: 'id' })
  console.log(`  ${v.version_id} ${v.version_name}: ${rows.length} cards`)
}

// ── Step 5: add STORE_JP versions ─────
console.log('\n[5] Add STORE_JP: HMV① / HMV② / HMV③ / EntryCard / Coaster / Tower / TSUTAYA / UMS / Rakuten')
const STORE = [
  { vid: 'V_JP006_BEN_HMV_1',           name: 'HMV・Loppi - Photocard ①', type: 'photocard',  detail: 'PhotoCard',   n: 2, store: 'HMV・Loppi' },
  { vid: 'V_JP006_BEN_HMV_2',           name: 'HMV・Loppi - Photocard ②', type: 'photocard',  detail: 'PhotoCard',   n: 2, store: 'HMV・Loppi' },
  { vid: 'V_JP006_BEN_HMV_3',           name: 'HMV・Loppi - Photocard ③', type: 'photocard',  detail: 'PhotoCard',   n: 2, store: 'HMV・Loppi' },
  { vid: 'V_JP006_BEN_HMV_ENTRYCARD',   name: 'HMV・Loppi - EntryCard',    type: 'photocard',  detail: 'EntryCard',   n: 1, store: 'HMV・Loppi' },
  { vid: 'V_JP006_BEN_HMV_COASTER',     name: 'HMV・Loppi - Coaster',      type: 'coaster',    detail: 'Coaster',     n: 1, store: 'HMV・Loppi' },
  { vid: 'V_JP006_BEN_TOWER_POSTCARD',  name: 'TOWER RECORDS - PostCard',  type: 'postcard',   detail: 'PostCard',    n: 1, store: 'TOWER RECORDS' },
  { vid: 'V_JP006_BEN_TSUTAYA_ICCARD',  name: 'TSUTAYA RECORDS - IC Card', type: 'ic_card',    detail: 'IC Card',     n: 1, store: 'TSUTAYA RECORDS' },
  { vid: 'V_JP006_BEN_UMS_CLEARFILE',   name: 'UNIVERSAL MUSIC STORE - ClearFile', type: 'clear_file', detail: 'ClearFile', n: 1, store: 'UNIVERSAL MUSIC STORE' },
  { vid: 'V_JP006_BEN_RAKUTEN_STICKER', name: '楽天ブックス - Sticker',      type: 'sticker',    detail: 'Sticker',     n: 1, store: '楽天ブックス' },
]
for (const v of STORE) {
  // UI pivot 用に "全形態 - {store}" 形式
  const displayName = `全形態 - ${v.store}`
  await s.from('card_versions').upsert({ version_id: v.vid, product_id: PID, version_name: displayName, tier: 'STORE_JP', sort_order: 0 }, { onConflict: 'version_id' })
  const rows = []
  for (const m of MEMBERS) {
    for (let i = 1; i <= v.n; i++) {
      rows.push({
        id: `CM_JP006_BEN_${v.vid.replace('V_JP006_BEN_','')}${v.n>1?'_'+i:''}_${m.id}`,
        product_id: PID, version_id: v.vid, member_id: m.id, member_name: m.name,
        card_type: v.type, card_detail: v.n>1 ? `${v.detail} ${i}` : v.detail,
        front_image_url: '', back_image_url: '',
      })
    }
  }
  await s.from('card_master').upsert(rows, { onConflict: 'id' })
  console.log(`  ${v.vid} ${displayName}: ${rows.length} cards`)
}

// ── Verification ──────────────────────────────
const { data: verAll } = await s.from('card_versions').select('version_id, version_name, tier, sort_order').eq('product_id', PID).order('tier').order('sort_order', { ascending: true, nullsFirst: false }).order('version_id')
console.log('\n=== Final state P_JP006 ===')
for (const v of verAll ?? []) {
  const { count } = await s.from('card_master').select('id', { count: 'exact', head: true }).eq('version_id', v.version_id)
  console.log(`  ${v.version_id} | ${v.tier} | sort=${v.sort_order} | ${v.version_name} | cards=${count}`)
}
const { count: total } = await s.from('card_master').select('id', { count: 'exact', head: true }).eq('product_id', PID)
console.log(`\nTotal card_master for ${PID}: ${total}`)
