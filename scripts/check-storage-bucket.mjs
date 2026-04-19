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

const { data: buckets } = await supabase.storage.listBuckets()
console.log('== Storage buckets ==')
for (const b of buckets || []) {
  console.log(`  ${b.name} (public=${b.public}) id=${b.id}`)
}

const CARD_BUCKET = buckets?.find(b => b.name === 'card-images')
console.log('')
console.log(CARD_BUCKET ? `✅ "card-images" bucket exists` : `❌ "card-images" bucket NOT FOUND`)

if (!CARD_BUCKET) {
  console.log('Creating "card-images" bucket...')
  const { error } = await supabase.storage.createBucket('card-images', { public: true })
  if (error) console.log('  Create ERR:', error.message)
  else console.log('  Created (public=true)')
}
