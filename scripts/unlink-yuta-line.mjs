import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const YUTA = '86c91b90-0060-4a3d-bf10-d5c846604882'
const { data: before } = await s.from('profiles').select('id, mail, line_user_id').eq('id', YUTA).single()
console.log('Before profiles:', before)

const { data } = await s.from('profiles').update({ line_user_id: '' }).eq('id', YUTA).select().single()
console.log('After  profiles:', { id: data.id, mail: data.mail, line_user_id: data.line_user_id })

// glide_users 側も同じメールで残ってたら空に
const { data: gBefore } = await s.from('glide_users').select('mail, line_user_id').eq('mail', 'yuta129@gmail.com')
console.log('Before glide_users:', gBefore)
if (gBefore && gBefore.length > 0) {
  await s.from('glide_users').update({ line_user_id: '' }).eq('mail', 'yuta129@gmail.com')
  console.log('glide_users: line_user_id cleared')
}
