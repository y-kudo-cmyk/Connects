// P_JP011 "ALWAYS YOURS" — additive seed (2026-04)
//
// 現状 (all photocard, detail=null, 13 members each):
//   V_JP011_01 限定A          (13)
//   V_JP011_02 限定B          (13)
//   V_JP011_03 限定C          (13)
//   V_JP011_04 限定D          (13)
//   V_JP011_05 通常           (13)  ← STANDARD に対応
//   V_JP011_06 セブンネット盤 (13)  ← 7NET に対応
//   V_JP011_07 フラッシュプライス盤 (13) ← FLASH PRICE に対応
//   V_JP011_08 CARAT盤        (13)  ← CARATver. に対応
//
// User directive:
//   - 限定A / B / C / D: photocard 13枚 追加 (detail='PhotoCard')
//   - M∞ CARD 追加 (new V_JP011_MCARD, 13枚 detail='M∞CARD')
//   - STANDARD → V_JP011_05 (通常) に 13枚追加
//   - 7NET      → V_JP011_06 (セブンネット盤) に 13枚追加
//   - FLASH PRICE → V_JP011_07 (フラッシュプライス盤) に 13枚追加
//   - CARATver. → V_JP011_08 (CARAT盤) に 13枚追加
//   - WEVERSE GB: V_JP011_BEN_WEVERSE_GB, photocard 13枚
//   - WEVERSE JP 2枚セット: V_JP011_BEN_WEVERSE_JP (13) + V_JP011_LUCKY_WEVERSE_JP (13)
//   - UMS / HMV / TR / TSUTAYA それぞれ通常特典13枚 + ラキドロ13枚
//   - 末尾の 7NET は album 内で二重記載と解釈し、追加扱いしない (既に 06 に追加済)
//
// 曖昧点:
//   * STANDARD は「通常」と同義と解釈。
//   * 既存 version 13枚 (detail=null) と追加 13枚 (detail='PhotoCard') が共存。

import { s, ensureVersion, upsertCards, buildMemberCards, summarizeProduct } from './_shared.mjs'

const PID = 'P_JP011'

async function main() {
  console.log(`\n================ ${PID} ALWAYS YOURS ================`)

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

  // 限定A/B/C/D
  const limitedMap = [
    { id: '01', name: '限定A', sort: 1 },
    { id: '02', name: '限定B', sort: 2 },
    { id: '03', name: '限定C', sort: 3 },
    { id: '04', name: '限定D', sort: 4 },
  ]
  for (const l of limitedMap) {
    await runPlan(`V_JP011_${l.id} ${l.name} PhotoCard`, {
      version_id: `V_JP011_${l.id}`, product_id: PID, version_name: l.name, tier: 'INCLUDED', sort_order: l.sort,
    }, { idSuffix: `${l.id}_PHOTO`, cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })
  }

  // M∞CARD (new)
  await runPlan('V_JP011_MCARD M∞CARD', {
    version_id: 'V_JP011_MCARD', product_id: PID, version_name: 'M∞CARD', tier: 'INCLUDED', sort_order: 9,
  }, { idSuffix: 'MCARD', cardDetailBase: 'M∞CARD', card_type: 'photocard', count: 1 })

  // STANDARD / 7NET / FLASH PRICE / CARATver.
  await runPlan('V_JP011_05 通常 (STANDARD)', {
    version_id: 'V_JP011_05', product_id: PID, version_name: '通常', tier: 'INCLUDED', sort_order: 5,
  }, { idSuffix: '05_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  await runPlan('V_JP011_06 セブンネット盤 (7NET)', {
    version_id: 'V_JP011_06', product_id: PID, version_name: 'セブンネット盤', tier: 'INCLUDED', sort_order: 6,
  }, { idSuffix: '06_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  await runPlan('V_JP011_07 フラッシュプライス盤 (FLASH PRICE)', {
    version_id: 'V_JP011_07', product_id: PID, version_name: 'フラッシュプライス盤', tier: 'INCLUDED', sort_order: 7,
  }, { idSuffix: '07_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  await runPlan('V_JP011_08 CARAT盤 (CARATver.)', {
    version_id: 'V_JP011_08', product_id: PID, version_name: 'CARAT盤', tier: 'INCLUDED', sort_order: 8,
  }, { idSuffix: '08_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  // WEVERSE GB
  await runPlan('V_JP011_BEN_WEVERSE_GB Weverse Shop GB', {
    version_id: 'V_JP011_BEN_WEVERSE_GB', product_id: PID, version_name: '全形態 - Weverse Shop GB', tier: 'STORE_JP', sort_order: 0,
  }, { idSuffix: 'BEN_WEVERSE_GB', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  // WEVERSE JP (通常 + ラキドロ)
  await runPlan('V_JP011_BEN_WEVERSE_JP Weverse Shop JP - PhotoCard', {
    version_id: 'V_JP011_BEN_WEVERSE_JP', product_id: PID, version_name: '全形態 - Weverse Shop JP', tier: 'STORE_JP', sort_order: 0,
  }, { idSuffix: 'BEN_WEVERSE_JP', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  await runPlan('V_JP011_LUCKY_WEVERSE_JP Weverse Shop JP - ラキドロ', {
    version_id: 'V_JP011_LUCKY_WEVERSE_JP', product_id: PID, version_name: '全形態 - Weverse Shop JP ラキドロ', tier: 'STORE_JP', sort_order: 0,
  }, { idSuffix: 'LUCKY_WEVERSE_JP', cardDetailBase: 'ラキドロ', card_type: 'luckydraw', count: 1 })

  // UMS / HMV / TOWER / TSUTAYA  (通常 + ラキドロ)
  const STORES = [
    { key: 'UMS',     name: 'UNIVERSAL MUSIC STORE' },
    { key: 'HMV',     name: 'HMV・Loppi' },
    { key: 'TOWER',   name: 'TOWER RECORDS' },
    { key: 'TSUTAYA', name: 'TSUTAYA RECORDS' },
  ]
  for (const st of STORES) {
    await runPlan(`V_JP011_BEN_${st.key} ${st.name} - PhotoCard`, {
      version_id: `V_JP011_BEN_${st.key}`, product_id: PID, version_name: `全形態 - ${st.name}`, tier: 'STORE_JP', sort_order: 0,
    }, { idSuffix: `BEN_${st.key}_PHOTO`, cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

    await runPlan(`V_JP011_LUCKY_${st.key} ${st.name} - ラキドロ`, {
      version_id: `V_JP011_LUCKY_${st.key}`, product_id: PID, version_name: `全形態 - ${st.name} ラキドロ`, tier: 'STORE_JP', sort_order: 0,
    }, { idSuffix: `LUCKY_${st.key}`, cardDetailBase: 'ラキドロ', card_type: 'luckydraw', count: 1 })
  }

  console.log(`\n[summary 07-always-yours] versions: +${versionsAdded} (existed=${versionsExisting}) / cards: +${cardsAdded} (existed=${cardsExisting})`)
  await summarizeProduct(PID)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
