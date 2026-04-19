// 公式スペックに存在しない V_JP010_03 限定C を削除
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Verify no user_cards
const { count } = await s.from('user_cards').select('*', { count: 'exact', head: true }).eq('version_id', 'V_JP010_03')
console.log(`user_cards for V_JP010_03: ${count}`)
if (count > 0) { console.error('ABORT: user_cards exist'); process.exit(1) }

// Delete card_master rows
const { error: cmErr, count: cmCount } = await s.from('card_master').delete({ count: 'exact' }).eq('version_id', 'V_JP010_03')
if (cmErr) { console.error(cmErr); process.exit(1) }
console.log(`✓ deleted card_master: ${cmCount}`)

// Delete version row
const { error: vErr } = await s.from('card_versions').delete().eq('version_id', 'V_JP010_03')
if (vErr) console.error(vErr)
else console.log(`✓ deleted version V_JP010_03`)

// Verify remaining P_JP010 versions
const { data: vers } = await s.from('card_versions').select('version_id, version_name').eq('product_id', 'P_JP010').order('sort_order')
console.log('\nRemaining P_JP010 versions:')
for (const v of vers) console.log(`  ${v.version_id} | ${v.version_name}`)
