import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

for (const name of ['tickets', 'memories']) {
  const { error } = await s.storage.createBucket(name, { public: true, fileSizeLimit: 10 * 1024 * 1024 })
  if (error && !String(error.message).includes('already exists')) {
    console.error(`${name}:`, error.message)
  } else {
    console.log(`${name}: ok`)
  }
}

const { data } = await s.storage.listBuckets()
console.log('\nall buckets:')
for (const b of data) console.log(`  ${b.name} | public=${b.public}`)
