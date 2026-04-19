// 公式スペックに合わせて card_detail を再設定
// 限定A → Selfie Photocard A + Photocard A
// 限定B → Selfie Photocard B + Photocard B
// 通常   → Selfie Photocard C
// フラッシュ → Selfie Photocard D
// CARAT   → Selfie Photocard E
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const updates = [
  { versionId: 'V_JP010_04', label: 'Selfie Photocard C' },  // 通常
  { versionId: 'V_JP010_05', label: 'Selfie Photocard D' },  // フラッシュ
  { versionId: 'V_JP010_06', label: 'Selfie Photocard E' },  // CARAT
]

for (const u of updates) {
  const { error } = await s.from('card_master')
    .update({ card_detail: u.label })
    .eq('version_id', u.versionId)
    .eq('card_type', 'photocard')
  if (error) console.error(`  ${u.versionId} err: ${error.message}`)
  else console.log(`✓ ${u.versionId}: → ${u.label}`)
}

// Verify
for (const u of updates) {
  const { data } = await s.from('card_master').select('card_detail').eq('version_id', u.versionId).limit(3)
  console.log(`${u.versionId}: sample detail = ${data?.[0]?.card_detail}`)
}
