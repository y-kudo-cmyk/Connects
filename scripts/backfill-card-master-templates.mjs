// 既存の user_cards の画像を card_master.front_image_url / back_image_url の空欄に埋める。
// 各 card_master_id につき最初にアップロードされた画像を採用 (created_at asc)。
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// 1) card_master の空欄 id を取得
const { data: masters } = await s.from('card_master').select('id, front_image_url, back_image_url')
const needsFront = new Set(masters.filter(m => !m.front_image_url).map(m => m.id))
const needsBack = new Set(masters.filter(m => !m.back_image_url).map(m => m.id))
console.log(`card_master rows: ${masters.length}, needs front: ${needsFront.size}, needs back: ${needsBack.size}`)

// 2) user_cards の画像付きを created_at 昇順で拾う (最初の uploader が勝ち)
const { data: ucs } = await s.from('user_cards')
  .select('card_master_id, front_image_url, back_image_url, created_at, user_id')
  .eq('status', 'ACTIVE')
  .not('card_master_id', 'is', null)
  .order('created_at', { ascending: true })

const frontWin = new Map()  // cardMasterId → {url, user_id}
const backWin = new Map()
for (const uc of ucs) {
  if (needsFront.has(uc.card_master_id) && uc.front_image_url && !frontWin.has(uc.card_master_id)) {
    frontWin.set(uc.card_master_id, { url: uc.front_image_url, user: uc.user_id })
  }
  if (needsBack.has(uc.card_master_id) && uc.back_image_url && !backWin.has(uc.card_master_id)) {
    backWin.set(uc.card_master_id, { url: uc.back_image_url, user: uc.user_id })
  }
}
console.log(`backfill targets: front ${frontWin.size}, back ${backWin.size}`)

// 3) Apply updates
let frontDone = 0, backDone = 0
for (const [id, { url }] of frontWin) {
  const { error } = await s.from('card_master').update({ front_image_url: url }).eq('id', id).is('front_image_url', null)
  // try again with empty string if first match was null-but-set-as-empty
  if (!error) frontDone++
  else {
    const { error: e2 } = await s.from('card_master').update({ front_image_url: url }).eq('id', id).eq('front_image_url', '')
    if (!e2) frontDone++
  }
}
for (const [id, { url }] of backWin) {
  const { error } = await s.from('card_master').update({ back_image_url: url }).eq('id', id).is('back_image_url', null)
  if (!error) backDone++
  else {
    const { error: e2 } = await s.from('card_master').update({ back_image_url: url }).eq('id', id).eq('back_image_url', '')
    if (!e2) backDone++
  }
}
console.log(`backfilled: front ${frontDone}, back ${backDone}`)

// 4) Verify
const { data: after } = await s.from('card_master').select('front_image_url, back_image_url')
const withFront = after.filter(m => m.front_image_url).length
const withBack = after.filter(m => m.back_image_url).length
console.log(`\nAfter: ${withFront}/${after.length} have front image, ${withBack}/${after.length} have back image`)
