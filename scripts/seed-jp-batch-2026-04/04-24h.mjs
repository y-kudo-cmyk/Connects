// P_JP005 "24H" — additive seed (2026-04)
//
// User directive:
//   - 限定C (V_JP005_04) 追加: photocard 13枚 追加 (detail="PhotoCard")
//   - 通常 追加: 新規 V_JP005_03 (通常盤) を作成, photocard 13枚
//   - Carat盤 (V_JP005_05) 追加: photocard 13枚 追加
//
// 現状:
//   V_JP005_01 限定A (13)
//   V_JP005_02 限定B (13)
//   V_JP005_04 限定C (13) ← 既に 13枚あるが追加
//   V_JP005_05 CARAT盤 (13) ← 既に 13枚あるが追加
//   V_JP005_03 は空きなので 通常盤 に割り当てる。
//
// 曖昧点:
//   * 既存の 限定C / CARAT盤 に既に photocard 13枚があるが、ユーザー修正リストは
//     "追加" とあるため、重複を避けるため detail を分けて挿入する。
//     既存 (detail=null) + 新規 (detail='PhotoCard') の 2グループを許容する。
//   * 通常盤の sort_order は空き (3) を使用。

import { s, ensureVersion, upsertCards, buildMemberCards, summarizeProduct } from './_shared.mjs'

const PID = 'P_JP005'

async function main() {
  console.log(`\n================ ${PID} 24H ================`)

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

  await runPlan('V_JP005_04 限定C', {
    version_id: 'V_JP005_04', product_id: PID, version_name: '限定C', tier: 'INCLUDED', sort_order: 3,
  }, { idSuffix: '04_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  // 通常盤 (new)
  await runPlan('V_JP005_03 通常盤', {
    version_id: 'V_JP005_03', product_id: PID, version_name: '通常盤', tier: 'INCLUDED', sort_order: 4,
  }, { idSuffix: '03_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  await runPlan('V_JP005_05 CARAT盤', {
    version_id: 'V_JP005_05', product_id: PID, version_name: 'CARAT盤', tier: 'INCLUDED', sort_order: 5,
  }, { idSuffix: '05_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  console.log(`\n[summary 04-24h] versions: +${versionsAdded} (existed=${versionsExisting}) / cards: +${cardsAdded} (existed=${cardsExisting})`)
  await summarizeProduct(PID)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
