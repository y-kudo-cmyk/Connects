// P_JP003 "HAPPY ENDING" — additive seed (2026-04)
//
// User directive:
//   - Carat盤 (V_JP003_05) は既に version としてある。中身 photocard 13枚を
//     "ショーケーストレカ" × 4枚/メンバー に拡張 → 52枚追加。
//   - 既存の V_JP003_05 photocard 13枚は card_detail=null のまま放置する
//     （今回の要件は "追加" なので既存行は変更しない）。
//
// 曖昧点:
//   * 既存 13枚と今回追加 52枚で同一メンバー・同一 version に 65枚出現する形となる。
//     UI 側で detail 別にグルーピングされていれば自然に見える想定。
//     既存 13枚の card_detail が null のままで良いかはユーザー確認要。

import { s, ensureVersion, upsertCards, buildMemberCards, summarizeProduct } from './_shared.mjs'

const PID = 'P_JP003'

async function main() {
  console.log(`\n================ ${PID} HAPPY ENDING ================`)

  const { count: ucCount } = await s.from('user_cards').select('id', { count: 'exact', head: true }).eq('product_id', PID)
  console.log(`[safety] user_cards for ${PID} = ${ucCount ?? 0}`)

  let versionsAdded = 0, versionsExisting = 0, cardsAdded = 0, cardsExisting = 0

  // V_JP003_05 (Carat盤 / CARAT盤) should already exist — make sure.
  const caratVid = 'V_JP003_05'
  const caratRes = await ensureVersion({
    version_id: caratVid,
    product_id: PID,
    version_name: 'CARAT盤',
    tier: 'INCLUDED',
    sort_order: 5,
  })
  if (caratRes.created) { versionsAdded++; console.log(`[+] version ${caratVid} created`) }
  else { versionsExisting++; console.log(`[=] version ${caratVid} already exists (${caratRes.existing.version_name})`) }

  // 追加: ショーケーストレカ 1..4 (photocard, 13メンバー) = 52行
  const rows = buildMemberCards({
    product_id: PID,
    version_id: caratVid,
    idSuffix: 'CARAT_SHOWCASE_TRECA',
    cardDetailBase: 'ショーケーストレカ',
    card_type: 'photocard',
    count: 4,
  })
  const res = await upsertCards(rows)
  cardsAdded += res.added
  cardsExisting += res.existed
  console.log(`[cards] ${caratVid} ショーケーストレカ 1..4: +${res.added} (existed=${res.existed})`)

  console.log(`\n[summary 02-happy-ending] versions: +${versionsAdded} (existed=${versionsExisting}) / cards: +${cardsAdded} (existed=${cardsExisting})`)
  await summarizeProduct(PID)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
