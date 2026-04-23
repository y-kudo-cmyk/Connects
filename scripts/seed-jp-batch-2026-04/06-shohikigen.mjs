// P_JP010 "消費期限 (Shohikigen)" — additive seed (2026-04)
//
// 現状:
//   V_JP010_01 限定A (26: Selfie Photocard A + Photocard A)
//   V_JP010_02 限定B (26: Selfie Photocard B + Photocard B)
//   V_JP010_04 通常 (13: Selfie Photocard C)
//   V_JP010_05 フラッシュプライス盤 (13: Selfie Photocard D)
//   V_JP010_06 CARAT盤 (13: Selfie Photocard E)
//
// User directive:
//   - FlashPrice / Carat盤: photocard 13枚 追加 (card_detail='PhotoCard')
//   - 店舗特典 (Weverse / UMS / HMV / タワレコ / TSUTAYA) 各 2枚:
//     通常特典 13枚 + ラキドロ 13枚 = 26枚/店舗
//
// 曖昧点:
//   * 限定A/B/通常 の追加は user リスト未記載 → 触らない。
//   * 既存 13枚 (Selfie Photocard D/E) がある版にさらに 13枚 (detail='PhotoCard') を
//     追加するため、UI 上同一 version に 2種類の photocard が並ぶ形。

import { s, ensureVersion, upsertCards, buildMemberCards, summarizeProduct } from './_shared.mjs'

const PID = 'P_JP010'

const STORES = [
  { key: 'WEVERSE', name: 'Weverse Shop' },
  { key: 'UMS',     name: 'UNIVERSAL MUSIC STORE' },
  { key: 'HMV',     name: 'HMV・Loppi' },
  { key: 'TOWER',   name: 'TOWER RECORDS' },
  { key: 'TSUTAYA', name: 'TSUTAYA RECORDS' },
]

async function main() {
  console.log(`\n================ ${PID} 消費期限 ================`)

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

  await runPlan('V_JP010_05 フラッシュプライス盤', {
    version_id: 'V_JP010_05', product_id: PID, version_name: 'フラッシュプライス盤', tier: 'INCLUDED', sort_order: 5,
  }, { idSuffix: '05_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  await runPlan('V_JP010_06 CARAT盤', {
    version_id: 'V_JP010_06', product_id: PID, version_name: 'CARAT盤', tier: 'INCLUDED', sort_order: 6,
  }, { idSuffix: '06_PHOTO', cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

  for (const st of STORES) {
    await runPlan(`V_JP010_BEN_${st.key} ${st.name} - PhotoCard`, {
      version_id: `V_JP010_BEN_${st.key}`, product_id: PID, version_name: `全形態 - ${st.name}`, tier: 'STORE_JP', sort_order: 0,
    }, { idSuffix: `BEN_${st.key}_PHOTO`, cardDetailBase: 'PhotoCard', card_type: 'photocard', count: 1 })

    await runPlan(`V_JP010_LUCKY_${st.key} ${st.name} - ラキドロ`, {
      version_id: `V_JP010_LUCKY_${st.key}`, product_id: PID, version_name: `全形態 - ${st.name} ラキドロ`, tier: 'STORE_JP', sort_order: 0,
    }, { idSuffix: `LUCKY_${st.key}`, cardDetailBase: 'ラキドロ', card_type: 'luckydraw', count: 1 })
  }

  console.log(`\n[summary 06-shohikigen] versions: +${versionsAdded} (existed=${versionsExisting}) / cards: +${cardsAdded} (existed=${cardsExisting})`)
  await summarizeProduct(PID)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
