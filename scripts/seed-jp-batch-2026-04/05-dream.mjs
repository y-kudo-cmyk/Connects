// P_JP008 "Dream" — additive seed (2026-04)
//
// 現状:
//   V_JP008_01 限定A    (13)
//   V_JP008_02 限定B    (13)
//   V_JP008_04 限定C    (13)
//   V_JP008_05 限定D    (13)
//   V_JP008_06 フラッシュプライス盤 (13)
//   V_JP008_07 CARAT盤 (13)
//
// User directive:
//   - 限定C / 限定D / 通常 / Carat盤 / FlashPrice:
//     各 version に photocard 13枚 追加 (card_detail='PhotoCard')。
//   - 通常 は既存に無いので新規 V_JP008_03 (通常盤) を作成。
//   - M∞ CARD 追加: 新規 V_JP008_MCARD, photocard 13枚 (detail='M∞CARD')
//   - 各店舗 (Weverse / UMS / HMV / タワレコ / TSUTAYA) 2枚セット:
//       ・通常特典 photocard 13枚 (V_JP008_BEN_<STORE>, detail='PhotoCard 1')
//       ・ラキドロ photocard 13枚 (V_JP008_LUCKY_<STORE>, detail='ラキドロ')
//
// 曖昧点:
//   * 限定A/B の扱いはリスト未記載 → 今回は触らない。
//   * 既存 version に 13枚 photocard が既にあるため、追加分は detail='PhotoCard' で
//     別グループとして共存させる (既存は detail=null のまま)。

import { s, ensureVersion, upsertCards, buildMemberCards, summarizeProduct } from './_shared.mjs'

const PID = 'P_JP008'

const STORES = [
  { key: 'WEVERSE', name: 'Weverse Shop' },
  { key: 'UMS',     name: 'UNIVERSAL MUSIC STORE' },
  { key: 'HMV',     name: 'HMV・Loppi' },
  { key: 'TOWER',   name: 'TOWER RECORDS' },
  { key: 'TSUTAYA', name: 'TSUTAYA RECORDS' },
]

async function main() {
  console.log(`\n================ ${PID} Dream ================`)

  const { count: ucCount } = await s.from('user_cards').select('id', { count: 'exact', head: true }).eq('product_id', PID)
  console.log(`[safety] user_cards for ${PID} = ${ucCount ?? 0}`)

  let versionsAdded = 0, versionsExisting = 0, cardsAdded = 0, cardsExisting = 0

  async function runPlan(label, versionSpec, cardSpec) {
    const vres = await ensureVersion(versionSpec)
    if (vres.created) { versionsAdded++; console.log(`[+] version ${versionSpec.version_id} (${versionSpec.version_name}) created`) }
    else { versionsExisting++; console.log(`[=] version ${versionSpec.version_id} exists`) }
    const rows = buildMemberCards({ product_id: PID, version_id: versionSpec.version_id, ...cardSpec })
    const res = await upsertCards(rows)
    cardsAdded += res.added
    cardsExisting += res.existed
    console.log(`[cards] ${label}: +${res.added} (existed=${res.existed})`)
  }

  // INCLUDED 既存 version に PhotoCard 追加
  await runPlan('V_JP008_04 限定C', { version_id: 'V_JP008_04', product_id: PID, version_name: '限定C', tier: 'INCLUDED', sort_order: 3 },
    { idSuffix: '04_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })
  await runPlan('V_JP008_05 限定D', { version_id: 'V_JP008_05', product_id: PID, version_name: '限定D', tier: 'INCLUDED', sort_order: 4 },
    { idSuffix: '05_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })
  await runPlan('V_JP008_06 フラッシュプライス盤', { version_id: 'V_JP008_06', product_id: PID, version_name: 'フラッシュプライス盤', tier: 'INCLUDED', sort_order: 6 },
    { idSuffix: '06_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })
  await runPlan('V_JP008_07 CARAT盤', { version_id: 'V_JP008_07', product_id: PID, version_name: 'CARAT盤', tier: 'INCLUDED', sort_order: 7 },
    { idSuffix: '07_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  // 通常盤 (new)
  await runPlan('V_JP008_03 通常盤', { version_id: 'V_JP008_03', product_id: PID, version_name: '通常盤', tier: 'INCLUDED', sort_order: 5 },
    { idSuffix: '03_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  // M∞ CARD (new)
  await runPlan('V_JP008_MCARD M∞CARD', { version_id: 'V_JP008_MCARD', product_id: PID, version_name: 'M∞CARD', tier: 'INCLUDED', sort_order: 8 },
    { idSuffix: 'MCARD', cardDetailBase: 'M∞CARD', card_type: 'photocard', count: 1 })

  // Store benefits + lucky draws
  for (const st of STORES) {
    await runPlan(`V_JP008_BEN_${st.key} ${st.name} - PhotoCard`, {
      version_id: `V_JP008_BEN_${st.key}`, product_id: PID, version_name: `全形態 - ${st.name}`, tier: 'STORE_JP', sort_order: 0,
    }, { idSuffix: `BEN_${st.key}_PHOTO`, cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

    await runPlan(`V_JP008_LUCKY_${st.key} ${st.name} - ラキドロ`, {
      version_id: `V_JP008_LUCKY_${st.key}`, product_id: PID, version_name: `全形態 - ${st.name} ラキドロ`, tier: 'STORE_JP', sort_order: 0,
    }, { idSuffix: `LUCKY_${st.key}`, cardDetailBase: 'ラキドロ', card_type: 'luckydraw', count: 1 })
  }

  console.log(`\n[summary 05-dream] versions: +${versionsAdded} (existed=${versionsExisting}) / cards: +${cardsAdded} (existed=${cardsExisting})`)
  await summarizeProduct(PID)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
