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

// Try uploading a test file to confirm bucket works
const testData = new Blob(['test'], { type: 'text/plain' })
const testPath = `cards/test-admin/verify-${Date.now()}.txt`
const { error: upErr } = await supabase.storage.from('card-images').upload(testPath, testData)
console.log(upErr ? `❌ Upload test failed: ${upErr.message}` : `✅ Upload test succeeded (${testPath})`)
if (!upErr) {
  await supabase.storage.from('card-images').remove([testPath])
  console.log('  (cleaned up test file)')
}

// Check policies existence via pg query (RPC if available)
const { data: policies, error: polErr } = await supabase
  .rpc('exec_sql', { sql: "select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname ilike '%card image%';" })
  .catch(() => ({ data: null, error: { message: 'no exec_sql RPC' } }))

if (polErr) {
  console.log('')
  console.log(`(policy check via RPC skipped: ${polErr.message})`)
  console.log('※ポリシー作成はSupabase SQL Editorで確認してください。')
} else {
  console.log('')
  console.log('Existing card-images policies:')
  for (const p of policies || []) console.log(`  - ${p.policyname}`)
}
