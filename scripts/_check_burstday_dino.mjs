import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// P_KR023 Happy Burstday: version毎にメンバー別カウント
const { data: vers } = await s.from('card_versions').select('version_id, version_name').eq('product_id', 'P_KR023').order('sort_order')
for (const v of vers) {
  const { data: cards } = await s.from('card_master').select('id, member_id, card_type, card_detail').eq('version_id', v.version_id).order('id')
  const perMember = new Map()
  const perMemberType = new Map()
  for (const c of cards) {
    perMember.set(c.member_id, (perMember.get(c.member_id) || 0) + 1)
    const key = c.member_id
    if (!perMemberType.has(key)) perMemberType.set(key, [])
    perMemberType.get(key).push(`${c.card_type}:${c.card_detail || ''}`)
  }
  console.log(`\n== ${v.version_id} ${v.version_name} ==`)
  // show count by member
  for (let i = 1; i <= 13; i++) {
    const id = `A${String(i).padStart(6, '0')}`
    const n = perMember.get(id) || 0
    const types = perMemberType.get(id) || []
    if (i === 13 || n < 4) {
      // show detail for DINO or incomplete members
      console.log(`  ${id}: ${n} | ${types.join(', ')}`)
    }
  }
  // Also compare DINO vs S.COUPS structure
  const dino = perMemberType.get('A000013') || []
  const scoups = perMemberType.get('A000001') || []
  if (dino.length !== scoups.length) {
    console.log(`  SCOUPS has ${scoups.length}: ${scoups.join(' / ')}`)
    console.log(`  DINO   has ${dino.length}: ${dino.join(' / ')}`)
  }
}
