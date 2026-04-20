// 各アルバムの既存 BEN_* バージョンに「Photocard 2」「Lucky Draw」枠を13名分ずつ追加
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const MEMBERS = Array.from({length: 13}, (_, i) => `A${String(i+1).padStart(6, '0')}`)

const TARGETS = [
  // {version, need: ['Photocard 2', 'Lucky Draw']}
  // KR018 FML: existing = スペシャルフォトカード (×13), add Photocard 2 + Lucky Draw
  { vid: 'V_KR018_BEN_WEVERSE_ABC',  add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR018_BEN_UMS_ABC',      add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR018_BEN_TSUTAYA_ABC',  add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR018_BEN_HMV_ABC',      add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR018_BEN_TOWER_ABC',    add: ['Photocard 2', 'Lucky Draw'] },
  // KR019 HEAVEN
  { vid: 'V_KR019_BEN_WEVERSE_AM526PM214PM1023', add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR019_BEN_UMS_AM526PM214PM1023',     add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR019_BEN_TSUTAYA_AM526PM214PM1023', add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR019_BEN_HMV_AM526PM214PM1023',     add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR019_BEN_TOWER_AM526PM214PM1023',   add: ['Photocard 2', 'Lucky Draw'] },
  // KR021 17 IS RIGHT HERE
  { vid: 'V_KR021_BEN_WEVERSE_HEREVerHEARVer', add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR021_BEN_UMS_HEREVerHEARVer',     add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR021_BEN_TSUTAYA_HEREVerHEARVer', add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR021_BEN_HMV_HEREVerHEARVer',     add: ['Photocard 2', 'Lucky Draw'] },
  { vid: 'V_KR021_BEN_TOWER_HEREVerHEARVer',   add: ['Photocard 2', 'Lucky Draw'] },
  // KR022 SPILL THE FEELS: already has 2 photocards (CARATVer + FEEL...), add LUCKY only to each
  { vid: 'V_KR022_BEN_WEVERSE_CARATVer',            add: ['Lucky Draw'] },
  { vid: 'V_KR022_BEN_WEVERSE_FEELBLUEFEELNEWFEELY',add: ['Lucky Draw'] },
  { vid: 'V_KR022_BEN_UMS_CARATVer',                add: ['Lucky Draw'] },
  { vid: 'V_KR022_BEN_UMS_FEELBLUEFEELNEWFEELY',    add: ['Lucky Draw'] },
  { vid: 'V_KR022_BEN_TSUTAYA_CARATVer',            add: ['Lucky Draw'] },
  { vid: 'V_KR022_BEN_TSUTAYA_FEELBLUEFEELNEWFEELY',add: ['Lucky Draw'] },
  { vid: 'V_KR022_BEN_HMV_CARATVer',                add: ['Lucky Draw'] },
  { vid: 'V_KR022_BEN_HMV_FEELBLUEFEELNEWFEELY',    add: ['Lucky Draw'] },
  { vid: 'V_KR022_BEN_TOWER_CARATVer',              add: ['Lucky Draw'] },
  { vid: 'V_KR022_BEN_TOWER_FEELBLUEFEELNEWFEELY',  add: ['Lucky Draw'] },
]

let created = 0
for (const t of TARGETS) {
  // Get product_id from existing row
  const { data: existing } = await s.from('card_master').select('product_id').eq('version_id', t.vid).limit(1).single()
  if (!existing) { console.log(`  skip ${t.vid}: no existing row`); continue }
  const pid = existing.product_id

  for (const detail of t.add) {
    for (const mid of MEMBERS) {
      // Check if already exists
      const { data: dup } = await s.from('card_master').select('id').eq('version_id', t.vid).eq('member_id', mid).eq('card_detail', detail).limit(1)
      if (dup?.length) continue
      const cardType = detail === 'Lucky Draw' ? 'luckydraw' : 'photocard'
      const memberNum = parseInt(mid.replace('A', ''), 10)
      const slug = detail === 'Lucky Draw' ? 'LD' : 'PC2'
      const id = `CM_${t.vid.replace(/^V_/, '')}_${slug}_${memberNum}`
      const { error } = await s.from('card_master').insert({
        id,
        product_id: pid,
        version_id: t.vid,
        member_id: mid,
        card_type: cardType,
        card_detail: detail,
        front_image_url: null,
      })
      if (error) { console.error(`  err ${t.vid} ${mid} ${detail}: ${error.message}`); continue }
      created++
    }
  }
  console.log(`  ✓ ${t.vid} (${t.add.join('+')})`)
}
console.log(`\nTotal created: ${created}`)
