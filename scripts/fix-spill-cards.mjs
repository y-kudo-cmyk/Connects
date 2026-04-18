import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const MEMBERS = Array.from({ length: 13 }, (_, i) => ({
  id: `A${String(i + 1).padStart(6, '0')}`,
  name: ['S.COUPS', 'JEONGHAN', 'JOSHUA', 'JUN', 'HOSHI', 'WONWOO', 'WOOZI', 'THE 8', 'MINGYU', 'DK', 'SEUNGKWAN', 'VERNON', 'DINO'][i],
}))

async function seedForVersion(versionId, perMember) {
  // まず既存カード削除
  await s.from('user_cards').delete().eq('version_id', versionId)
  await s.from('card_master').delete().eq('version_id', versionId)
  const cards = []
  let idx = 1
  for (const m of MEMBERS) {
    for (let i = 1; i <= perMember; i++) {
      cards.push({
        id: `CM_KR022_${versionId.split('_').pop()}_${String(idx).padStart(3, '0')}`,
        product_id: 'P_KR022',
        version_id: versionId,
        member_id: m.id,
        member_name: m.name,
        card_type: 'photocard',
        card_detail: `Photocard ${i}`,
        front_image_url: '',
        back_image_url: '',
      })
      idx++
    }
  }
  const { error } = await s.from('card_master').upsert(cards, { onConflict: 'id' })
  if (error) throw error
  console.log(`  ${versionId}: ${cards.length} cards`)
}

// FEEL BLUE: 13 × 2 = 26
await seedForVersion('V_KR022_00', 2)
// FEEL NEW / FEEL YOU は既に26あるが一貫性のため再投入
await seedForVersion('V_KR022_02', 2)
await seedForVersion('V_KR022_03', 2)
// CARAT: 13 × 4 = 52
await seedForVersion('V_KR022_01', 4)
