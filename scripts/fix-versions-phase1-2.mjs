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

// ── Phase 1: delete clearly-wrong versions ──────────────────
const DELETE_VERSION_IDS = [
  'V_KR003_03', // LOVE&LETTER: make a seventeen
  'V_KR005_03', // Going Seventeen: orange
  'V_KR005_04', // Going Seventeen: rq&s
  'V_KR008_03', // Director's Cut: set the sun
  'V_KR013_02', // ; [Semicolon]: dul
  'V_KR013_03', // ; [Semicolon]: set
  'V_KR013_04', // ; [Semicolon]: net
  'V_KR016_06', // Face the Sun: carat (dup)
  'V_KR019_05', // SEVENTEENTH HEAVEN: pioneer
  'V_KR019_06', // SEVENTEENTH HEAVEN: carat (dup of V_KR019_04)
  'V_KR022_04', // SPILL THE FEELS: carat (dup of V_KR022_01)
]

console.log('== Phase 1: delete wrong versions ==')

// Dependency: user_cards uses version_id text (not FK). Still, keep orphans in check.
for (const tbl of ['user_cards', 'card_master']) {
  const { count } = await supabase.from(tbl).select('*', { count: 'exact', head: true }).in('version_id', DELETE_VERSION_IDS)
  if (count && count > 0) {
    const { error } = await supabase.from(tbl).delete().in('version_id', DELETE_VERSION_IDS)
    if (error) console.log(`  ${tbl} delete ERR:`, error.message)
    else console.log(`  ${tbl}: deleted ${count} rows referencing wrong versions`)
  }
}

const { error: verErr, count: verCnt } = await supabase
  .from('card_versions')
  .delete({ count: 'exact' })
  .in('version_id', DELETE_VERSION_IDS)
if (verErr) console.log('  card_versions ERR:', verErr.message)
else console.log(`  card_versions: deleted ${verCnt} rows`)

// ── Phase 2: rebuild HAPPY BURSTDAY versions ────────────────
console.log('')
console.log('== Phase 2: rebuild HAPPY BURSTDAY versions ==')

const OLD_HB_VERSIONS = ['V_KR023_01', 'V_KR023_02', 'V_KR023_03', 'V_KR023_04', 'V_KR023_05', 'V_KR023_06']

for (const tbl of ['user_cards', 'card_master']) {
  const { count } = await supabase.from(tbl).select('*', { count: 'exact', head: true }).in('version_id', OLD_HB_VERSIONS)
  if (count && count > 0) {
    const { error } = await supabase.from(tbl).delete().in('version_id', OLD_HB_VERSIONS)
    if (error) console.log(`  ${tbl} delete ERR:`, error.message)
    else console.log(`  ${tbl}: deleted ${count} rows (old HAPPY BURSTDAY)`)
  }
}

const { error: hbDelErr, count: hbDelCnt } = await supabase
  .from('card_versions')
  .delete({ count: 'exact' })
  .in('version_id', OLD_HB_VERSIONS)
if (hbDelErr) console.log('  card_versions delete ERR:', hbDelErr.message)
else console.log(`  card_versions: deleted ${hbDelCnt} rows (old HAPPY BURSTDAY)`)

const NEW_HB_VERSIONS = [
  { version_id: 'V_KR023_01', product_id: 'P_KR023', version_name: 'NEW ESCAPE Ver.' },
  { version_id: 'V_KR023_02', product_id: 'P_KR023', version_name: 'NEW MYSELF Ver.' },
  { version_id: 'V_KR023_03', product_id: 'P_KR023', version_name: 'NEW BURSTDAY Ver.' },
  { version_id: 'V_KR023_04', product_id: 'P_KR023', version_name: 'DAREDEVIL Ver.' },
  { version_id: 'V_KR023_05', product_id: 'P_KR023', version_name: 'Weverse Albums Ver.' },
  { version_id: 'V_KR023_06', product_id: 'P_KR023', version_name: 'KiT NEW ESCAPE Ver.' },
  { version_id: 'V_KR023_07', product_id: 'P_KR023', version_name: 'KiT NEW BURSTDAY Ver.' },
]

const { error: insErr } = await supabase.from('card_versions').insert(NEW_HB_VERSIONS)
if (insErr) console.log('  card_versions insert ERR:', insErr.message)
else console.log(`  card_versions: inserted ${NEW_HB_VERSIONS.length} new HAPPY BURSTDAY versions`)

// ── Phase 4: ALWAYS YOURS standard version ──────────────────
console.log('')
console.log('== Phase 4: add standard version to ALWAYS YOURS ==')
const { error: ayErr } = await supabase.from('card_versions').insert([
  { version_id: 'V_JP011_01', product_id: 'P_JP011', version_name: 'standard' },
])
if (ayErr) console.log('  card_versions insert ERR:', ayErr.message)
else console.log('  card_versions: inserted V_JP011_01 standard')

// ── Verify ──────────────────────────────────────────────────
console.log('')
console.log('== After fixes: HAPPY BURSTDAY versions ==')
const { data: hbNow } = await supabase.from('card_versions').select('version_id, version_name').eq('product_id', 'P_KR023').order('version_id')
for (const v of hbNow || []) console.log(`  ${v.version_id}: ${v.version_name}`)

console.log('')
console.log('== ALWAYS YOURS ==')
const { data: ay } = await supabase.from('card_versions').select('version_id, version_name').eq('product_id', 'P_JP011')
for (const v of ay || []) console.log(`  ${v.version_id}: ${v.version_name}`)
