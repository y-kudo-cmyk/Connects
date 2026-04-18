import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const OLD_PIDS = ['P_KR001','P_KR002','P_KR003','P_KR004','P_KR005','P_KR006','P_KR007','P_KR008']

for (const pid of OLD_PIDS) {
  const { data: vers } = await s.from('card_versions').select('version_id, version_name').eq('product_id', pid).order('version_id')
  if (!vers || vers.length === 0) continue
  let i = 1
  for (const v of vers) {
    // BEN_ / LUCKY_ はスキップ（tier別グループなので0のままでOK）
    if (v.version_id.includes('_BEN_') || v.version_id.includes('_LUCKY_')) continue
    await s.from('card_versions').update({ sort_order: i }).eq('version_id', v.version_id)
    console.log(`${pid} | sort=${i} | ${v.version_name}`)
    i++
  }
}
