import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// BEN_ / LUCKY_ の version_id に紐づく card_master の back_image_url を空に
const { data: vers } = await s.from('card_versions').select('version_id').or('version_id.like.%_BEN_%,version_id.like.%_BENEFIT_%,version_id.like.%_LUCKY_%')
const vids = (vers || []).map(v => v.version_id)
console.log(`target versions: ${vids.length}`)

const { count: before } = await s.from('card_master').select('*', { count: 'exact', head: true }).in('version_id', vids).not('back_image_url', 'is', null).neq('back_image_url', '')
console.log(`cards with back_image_url: ${before}`)

const { error } = await s.from('card_master').update({ back_image_url: '' }).in('version_id', vids)
if (error) { console.error(error); process.exit(1) }
console.log('cleared')
