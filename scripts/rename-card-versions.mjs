import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Rename rules (prefix before " - {store}"):
// ラキドロ → LUCKY DRAW
// DAREDEVIL版 → DAREDEVIL
// 通常版 → 通常
// 通常盤 → 通常

const { data: all } = await s.from('card_versions').select('version_id, version_name')
let renamed = 0
for (const v of all) {
  const name = v.version_name || ''
  let newName = name
  newName = newName.replace(/^ラキドロ/, 'LUCKY DRAW')
  newName = newName.replace(/^DAREDEVIL版/, 'DAREDEVIL')
  newName = newName.replace(/^通常版/, '通常')
  newName = newName.replace(/^通常盤/, '通常')
  if (newName !== name) {
    await s.from('card_versions').update({ version_name: newName }).eq('version_id', v.version_id)
    console.log(`${v.version_id}: "${name}" → "${newName}"`)
    renamed++
  }
}
console.log(`\nrenamed: ${renamed}`)
