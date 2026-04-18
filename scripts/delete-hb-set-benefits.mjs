import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// HAPPY BURSTDAYの3バージョンセット特典を削除
const { data: versions } = await s.from('card_versions').select('version_id').like('version_id', 'V_KR023_BEN_%3versionSET')
const ids = (versions || []).map(v => v.version_id)
console.log('削除対象 versions:', ids)

if (ids.length) {
  await s.from('user_cards').delete().in('version_id', ids)
  await s.from('card_master').delete().in('version_id', ids)
  const { count } = await s.from('card_versions').delete({ count: 'exact' }).in('version_id', ids)
  console.log(`deleted ${count} versions`)
}
