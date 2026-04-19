import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const FIXES = [
  // 17 IS RIGHT HERE
  { product_id: 'P_KR021', old: 'DEAR', new: 'HEAR' },
  // SPILL THE FEELS
  { product_id: 'P_KR022', old: 'FEELING', new: 'FEEL NEW' },
  { product_id: 'P_KR022', old: 'SPILL', new: 'FEEL YOU' },
  // FML
  { product_id: 'P_KR018', old: 'FIGHT OR LOVE', new: 'FIGHT FOR MY LIFE' },
  { product_id: 'P_KR018', old: 'FADED MONO LOVE', new: 'FADED MONO LIFE' },
]

for (const f of FIXES) {
  const { data, error } = await s
    .from('card_versions')
    .update({ version_name: f.new })
    .eq('product_id', f.product_id)
    .eq('version_name', f.old)
    .select()
  console.log(`${f.product_id} | ${f.old} → ${f.new}: ${error ? 'ERR ' + error.message : `${data?.length || 0} row(s)`}`)
}

// Add missing FEEL BLUE to SPILL THE FEELS
const { error: blueErr } = await s
  .from('card_versions')
  .upsert({ version_id: 'V_KR022_00', product_id: 'P_KR022', version_name: 'FEEL BLUE' }, { onConflict: 'version_id' })
console.log(`P_KR022 add FEEL BLUE: ${blueErr ? 'ERR ' + blueErr.message : 'OK'}`)
