import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await s.from('card_versions').select('version_id, version_name').eq('product_id', 'P_KR023').like('version_id', '%_BEN_%')

let updates = 0
for (const v of data || []) {
  const sepIdx = v.version_name.indexOf(' - ')
  if (sepIdx < 0) continue
  const store = v.version_name.slice(sepIdx + 3)
  let base = ''
  if (v.version_id.includes('_DAREDEVIL')) base = 'DAREDEVIL版'
  else if (v.version_id.includes('NEWESCAPEVerNEWMYSEL')) base = '通常版'
  else if (v.version_id.includes('3versionSET')) base = '3バージョンセット'
  else continue
  const newName = `${base} - ${store}`
  if (newName === v.version_name) continue
  const { error } = await s.from('card_versions').update({ version_name: newName }).eq('version_id', v.version_id)
  if (!error) {
    console.log(`${v.version_id} | ${v.version_name}  →  ${newName}`)
    updates++
  }
}
console.log(`\nUpdated: ${updates}`)
