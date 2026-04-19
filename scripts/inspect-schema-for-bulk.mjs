import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// Members
const { data: members } = await s.from('members').select('*').order('member_id')
console.log('== members ==')
for (const m of members || []) console.log(JSON.stringify(m))

// Sample card_master row
const { data: cmSample } = await s.from('card_master').select('*').limit(1)
console.log('\n== card_master sample columns ==')
console.log(Object.keys(cmSample?.[0] || {}))
console.log(JSON.stringify(cmSample?.[0], null, 2))

// card_versions sample
const { data: cvSample } = await s.from('card_versions').select('*').limit(1)
console.log('\n== card_versions sample columns ==')
console.log(Object.keys(cvSample?.[0] || {}))
console.log(JSON.stringify(cvSample?.[0], null, 2))

// V_KR023_04 current state
const { data: v04cards, count: v04count } = await s
  .from('card_master')
  .select('*', { count: 'exact' })
  .eq('version_id', 'V_KR023_04')
console.log(`\n== V_KR023_04 count: ${v04count} ==`)
for (const c of (v04cards || []).slice(0, 3)) console.log(JSON.stringify(c))

// All card_versions for KR023
const { data: kr23v } = await s.from('card_versions').select('*').eq('product_id', 'P_KR023').order('version_id')
console.log('\n== P_KR023 versions ==')
for (const v of kr23v || []) console.log(JSON.stringify(v))

// CARAT versions
const { data: caratV } = await s.from('card_versions').select('*').ilike('version_name', '%CARAT%').order('version_id')
console.log('\n== CARAT versions ==')
for (const v of caratV || []) console.log(JSON.stringify(v))

// List versions for the 4 target products
for (const pid of ['P_KR018', 'P_KR019', 'P_KR021', 'P_KR022']) {
  const { data } = await s.from('card_versions').select('version_id, version_name, product_id, tier').eq('product_id', pid).order('version_id')
  console.log(`\n== ${pid} versions ==`)
  for (const v of data || []) {
    const { count } = await s.from('card_master').select('*', { count: 'exact', head: true }).eq('version_id', v.version_id)
    console.log(`${v.version_id} | ${v.version_name} | tier=${v.tier ?? 'null'} | cards=${count}`)
  }
}
