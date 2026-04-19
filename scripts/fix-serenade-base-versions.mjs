import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PID = 'P_UN005'

// Phase 1: delete old duplicate versions (BENEFIT_* - old naming, BEN_* is current)
const DELETE_IDS = [
  'V_UN005_01', // standard (leftover)
  'V_UN005_BENEFIT_BE_HMV', 'V_UN005_BENEFIT_BE_TOWER', 'V_UN005_BENEFIT_BE_TSUTAYA', 'V_UN005_BENEFIT_BE_UMS', 'V_UN005_BENEFIT_BE_WEVERSE',
  'V_UN005_BENEFIT_CP_HMV', 'V_UN005_BENEFIT_CP_TOWER', 'V_UN005_BENEFIT_CP_TSUTAYA', 'V_UN005_BENEFIT_CP_UMS', 'V_UN005_BENEFIT_CP_WEVERSE',
]
console.log('Cleaning duplicates...')
await s.from('card_master').delete().in('version_id', DELETE_IDS)
const { count: delCount } = await s.from('card_versions').delete({ count: 'exact' }).in('version_id', DELETE_IDS)
console.log(`  Deleted ${delCount} duplicate versions`)

// Phase 2: Add base BLUE / ECHO / COMPACT versions
const DK = { id: 'A000010', name: 'DK' }
const SEUNGKWAN = { id: 'A000011', name: 'SEUNGKWAN' }

const baseVersions = [
  { version_id: 'V_UN005_BLUE',    version_name: 'BLUE Ver.',    count: 2 },
  { version_id: 'V_UN005_ECHO',    version_name: 'ECHO Ver.',    count: 2 },
  { version_id: 'V_UN005_COMPACT', version_name: 'COMPACT Ver.', count: 2 },
]
const versions = baseVersions.map(b => ({ version_id: b.version_id, product_id: PID, version_name: b.version_name }))
await s.from('card_versions').upsert(versions, { onConflict: 'version_id' })
console.log(`  Inserted ${versions.length} base versions`)

const cards = []
for (const b of baseVersions) {
  const mems = [DK, SEUNGKWAN]
  for (let i = 0; i < mems.length; i++) {
    cards.push({
      id: `CM_UN005_${b.version_id.split('_').pop()}_${i + 1}`,
      product_id: PID,
      version_id: b.version_id,
      member_id: mems[i].id,
      member_name: mems[i].name,
      card_type: 'photocard',
      card_detail: 'Photocard',
      front_image_url: '',
      back_image_url: '',
    })
  }
}
await s.from('card_master').upsert(cards, { onConflict: 'id' })
console.log(`  Inserted ${cards.length} cards for base versions`)

// Final verify
const { data: finalVersions } = await s.from('card_versions').select('version_id, version_name').eq('product_id', PID).order('version_id')
console.log('\nFinal Serenade versions:')
for (const v of finalVersions || []) {
  const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.version_id)
  console.log(`  ${v.version_id} | ${v.version_name} | cards=${count}`)
}
