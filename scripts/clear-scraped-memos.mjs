import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Fetch all spots with memos containing scrape markers
const { data: all } = await s.from('spots').select('id, memo')
let updated = 0
for (const sp of all) {
  const memo = sp.memo || ''
  if (!memo) continue
  // Check if it's a scraped pattern
  const isScraped =
    memo.includes('[인스타그램]') ||
    memo.includes('[SVT Record]') ||
    /^instagram story/i.test(memo)
  if (!isScraped) continue

  const { error } = await s.from('spots').update({ memo: '' }).eq('id', sp.id)
  if (error) console.error(`${sp.id}:`, error.message)
  else updated++
}
console.log(`cleared memo on ${updated} spots`)

// Verify
const { count: remaining } = await s.from('spots').select('*', { count: 'exact', head: true }).or('memo.ilike.%[인스%,memo.ilike.%SVT Record%,memo.ilike.%instagram story%')
console.log(`remaining scraped memos: ${remaining}`)
