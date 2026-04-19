import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: glide } = await s.from('glide_users').select('mail, line_user_id').eq('mail', 'y-kudo@connectsplus.net')
console.log('glide_users matches:', glide)

if (glide && glide.length > 0) {
  const { error } = await s.from('glide_users').update({ line_user_id: '' }).eq('mail', 'y-kudo@connectsplus.net')
  console.log(error ? `err: ${error.message}` : 'glide_users cleared')
}
