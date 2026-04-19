import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const MEMBERS = [
  { id: 'A000001', name: 'S.COUPS' },
  { id: 'A000002', name: 'JEONGHAN' },
  { id: 'A000003', name: 'JOSHUA' },
  { id: 'A000004', name: 'JUN' },
  { id: 'A000005', name: 'HOSHI' },
  { id: 'A000006', name: 'WONWOO' },
  { id: 'A000007', name: 'WOOZI' },
  { id: 'A000008', name: 'THE 8' },
  { id: 'A000009', name: 'MINGYU' },
  { id: 'A000010', name: 'DK' },
  { id: 'A000011', name: 'SEUNGKWAN' },
  { id: 'A000012', name: 'VERNON' },
  { id: 'A000013', name: 'DINO' },
]

// Per-version card structure (matches original mockup)
const VERSION_CARDS = {
  'V_KR023_01': { name: 'NEW ESCAPE Ver.', cards: ['Photocard 1', 'Photocard 2', 'Photocard 3', 'Photocard 4', 'Tear-off Poster'] },
  'V_KR023_02': { name: 'NEW MYSELF Ver.', cards: ['Photocard 1', 'Photocard 2', 'Photocard 3', 'Photocard 4', 'Puzzle', 'Scratch Card'] },
  'V_KR023_03': { name: 'NEW BURSTDAY Ver.', cards: ['Photocard 1', 'Photocard 2', 'Photocard 3', 'Photocard 4', 'ID Card'] },
  'V_KR023_04': { name: 'DAREDEVIL Ver.', cards: ['Photocard 1', 'Photocard 2', 'Photocard 3', 'Photocard 4', 'Fotocard'] },
  'V_KR023_05': { name: 'Weverse Albums Ver.', cards: ['Photocard 1', 'Photocard 2', 'Photocard 3'] },
  'V_KR023_06': { name: 'KiT NEW ESCAPE Ver.', cards: ['GREEN'] },
  'V_KR023_07': { name: 'KiT NEW BURSTDAY Ver.', cards: ['WHITE'] },
}

const rows = []
let idx = 1
for (const versionId of Object.keys(VERSION_CARDS)) {
  const { cards } = VERSION_CARDS[versionId]
  for (const member of MEMBERS) {
    for (const cardDetail of cards) {
      rows.push({
        id: `CM_KR023_${String(idx).padStart(5, '0')}`,
        product_id: 'P_KR023',
        version_id: versionId,
        member_id: member.id,
        member_name: member.name,
        card_type: cardDetail.includes('Photocard') ? 'photocard' : cardDetail.toLowerCase().replace(/\s+/g, '_'),
        card_detail: cardDetail,
        front_image_url: '',
        back_image_url: '',
      })
      idx++
    }
  }
}

console.log(`Inserting ${rows.length} card_master rows for HAPPY BURSTDAY...`)

const CHUNK = 500
let inserted = 0
for (let i = 0; i < rows.length; i += CHUNK) {
  const slice = rows.slice(i, i + CHUNK)
  const { error } = await supabase.from('card_master').insert(slice)
  if (error) { console.error('Insert ERR:', error.message); process.exit(1) }
  inserted += slice.length
}
console.log(`Inserted ${inserted} rows`)

const { count } = await supabase
  .from('card_master')
  .select('*', { count: 'exact', head: true })
  .eq('product_id', 'P_KR023')
console.log(`HAPPY BURSTDAY card_master count: ${count}`)
