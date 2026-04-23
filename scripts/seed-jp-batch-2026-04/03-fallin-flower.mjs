// P_JP004 "舞い落ちる花びら (Fallin' Flower)" — additive seed (2026-04)
//
// User directive:
//   - Carat盤 (V_JP004_05): ショーケーストレカ 4枚/メンバー × 13 = 52枚 を追加。
//     ※ 明記されていないが P_JP003 と揃えて推測。
//   - HMV 特典: photocard 4枚/メンバー × 13 = 52枚 (V_JP004_BEN_HMV)
//   - Entry Card: 13枚 (V_JP004_BEN_HMV_ENTRYCARD, HMV特典の一部)
//   - TSUTAYA IC Card: 13枚 (V_JP004_BEN_TSUTAYA_ICCARD, card_type=ic_card)
//   - UMS Clear File: 13枚 (V_JP004_BEN_UMS_CLEARFILE, card_type=clear_file)
//   - TR Clear Post Card: 13枚 (V_JP004_BEN_TOWER_POSTCARD, card_type=postcard)
//
// 曖昧点:
//   * HMV photocard 4枚 の内訳 (番号付け) はリスト内で不明。"PhotoCard 1..4" と採番。
//   * Carat盤の追加 photocard 数も明示なし → P_JP003 と揃えて 4枚/メンバー。

import { s, ensureVersion, upsertCards, buildMemberCards, summarizeProduct } from './_shared.mjs'

const PID = 'P_JP004'

async function main() {
  console.log(`\n================ ${PID} 舞い落ちる花びら ================`)

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

  // Carat盤 中身追加 (既存 version)
  await runPlan('V_JP004_05 CARAT盤 ショーケーストレカ', {
    version_id: 'V_JP004_05', product_id: PID, version_name: 'CARAT盤', tier: 'INCLUDED', sort_order: 5,
  }, { idSuffix: 'CARAT_SHOWCASE_TRECA', cardDetailBase: 'ショーケーストレカ', card_type: 'photocard', count: 4 })

  // HMV メイン特典: photocard 4枚
  await runPlan('V_JP004_BEN_HMV HMV・Loppi - PhotoCard', {
    version_id: 'V_JP004_BEN_HMV', product_id: PID, version_name: '全形態 - HMV・Loppi', tier: 'STORE_JP', sort_order: 0,
  }, { idSuffix: 'BEN_HMV_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 4 })

  // HMV EntryCard
  await runPlan('V_JP004_BEN_HMV_ENTRYCARD HMV・Loppi - EntryCard', {
    version_id: 'V_JP004_BEN_HMV_ENTRYCARD', product_id: PID, version_name: '全形態 - HMV・Loppi EntryCard', tier: 'STORE_JP', sort_order: 0,
  }, { idSuffix: 'BEN_HMV_ENTRYCARD', cardDetailBase: 'EntryCard', card_type: 'photocard', count: 1 })

  // TSUTAYA IC Card
  await runPlan('V_JP004_BEN_TSUTAYA_ICCARD TSUTAYA RECORDS - IC Card', {
    version_id: 'V_JP004_BEN_TSUTAYA_ICCARD', product_id: PID, version_name: '全形態 - TSUTAYA RECORDS', tier: 'STORE_JP', sort_order: 0,
  }, { idSuffix: 'BEN_TSUTAYA_ICCARD', cardDetailBase: 'IC Card', card_type: 'ic_card', count: 1 })

  // UMS ClearFile
  await runPlan('V_JP004_BEN_UMS_CLEARFILE UNIVERSAL MUSIC STORE - ClearFile', {
    version_id: 'V_JP004_BEN_UMS_CLEARFILE', product_id: PID, version_name: '全形態 - UNIVERSAL MUSIC STORE', tier: 'STORE_JP', sort_order: 0,
  }, { idSuffix: 'BEN_UMS_CLEARFILE', cardDetailBase: 'ClearFile', card_type: 'clear_file', count: 1 })

  // TOWER RECORDS Clear PostCard
  await runPlan('V_JP004_BEN_TOWER_POSTCARD TOWER RECORDS - ClearPostCard', {
    version_id: 'V_JP004_BEN_TOWER_POSTCARD', product_id: PID, version_name: '全形態 - TOWER RECORDS', tier: 'STORE_JP', sort_order: 0,
  }, { idSuffix: 'BEN_TOWER_POSTCARD', cardDetailBase: 'ClearPostCard', card_type: 'postcard', count: 1 })

  console.log(`\n[summary 03-fallin-flower] versions: +${versionsAdded} (existed=${versionsExisting}) / cards: +${cardsAdded} (existed=${cardsExisting})`)
  await summarizeProduct(PID)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
