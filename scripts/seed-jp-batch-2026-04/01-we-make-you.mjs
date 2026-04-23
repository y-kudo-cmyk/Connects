// P_JP002 "We Make You" — additive seed (2026-04)
//
// User directive:
//   - 限定A/B/通常 は既存 52枚のまま。
//   - 限定C ×:  "×" は「カード追加なし」と解釈 → 今回は触らない。
//   - Carat盤 追加: 新規 version V_JP002_CARAT を作成。
//     ショーケースセルカ 4枚/メンバー × 13 = 52枚 を photocard として挿入。
//
// Notes / 曖昧点:
//   * 既存の 限定A/B/C/通常 が "V_JP001_01..04" という ID バグを持っているが、
//     今回はリネームせず放置する。P_JP002 の新規 VER だけ正しく V_JP002_* を採番。
//   * Carat盤 用の sort_order は既存の最大 (上記 4件は sort_order=0 扱い) を考慮し 5 に設定。

import { s, MEMBERS, ensureVersion, upsertCards, buildMemberCards, summarizeProduct } from './_shared.mjs'

const PID = 'P_JP002'

async function main() {
  console.log(`\n================ ${PID} We Make You ================`)

  // 安全確認: user_cards が 0 であること
  const { count: ucCount } = await s.from('user_cards').select('id', { count: 'exact', head: true }).eq('product_id', PID)
  console.log(`[safety] user_cards for ${PID} = ${ucCount ?? 0}`)

  let versionsAdded = 0
  let versionsExisting = 0
  let cardsAdded = 0
  let cardsExisting = 0

  // --- Carat盤 (新規) ---
  const caratVid = 'V_JP002_CARAT'
  const caratRes = await ensureVersion({
    version_id: caratVid,
    product_id: PID,
    version_name: 'Carat盤',
    tier: 'INCLUDED',
    sort_order: 5,
  })
  if (caratRes.created) { versionsAdded++; console.log(`[+] version ${caratVid} created`) }
  else { versionsExisting++; console.log(`[=] version ${caratVid} already exists`) }

  const caratRows = buildMemberCards({
    product_id: PID,
    version_id: caratVid,
    idSuffix: 'CARAT_SHOWCASE',
    cardDetailBase: 'ショーケースセルカ',
    card_type: 'photocard',
    count: 4,
  })
  const caratCards = await upsertCards(caratRows)
  cardsAdded += caratCards.added
  cardsExisting += caratCards.existed
  console.log(`[cards] ${caratVid} Carat盤 ショーケースセルカ: +${caratCards.added} (existed=${caratCards.existed})`)

  // --- 限定C ×: no cards added (explicitly skipped) ---
  console.log(`[skip] 限定C "×" → cards not added (user directive)`)

  console.log(`\n[summary 01-we-make-you] versions: +${versionsAdded} (existed=${versionsExisting}) / cards: +${cardsAdded} (existed=${cardsExisting})`)
  await summarizeProduct(PID)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
