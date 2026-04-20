import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const REFS = 'C:\\Users\\D-LINE\\connects-plus\\scripts\\_refs_ascii\\facethesun'
const first = readdirSync(REFS).filter(f => !f.includes('(1)'))[0]
const meta0 = await sharp(readFileSync(`${REFS}\\${first}`)).metadata()
const TS = { width: meta0.width, height: meta0.height }
console.log('TS:', TS)

const CARDS = [
  { versionId: 'V_KR016_01', detail: 'Photocard 1', left: 74,  top: 324, width: 108, height: 170 },
  { versionId: 'V_KR016_01', detail: 'Photocard 2', left: 189, top: 324, width: 107, height: 170 },
  { versionId: 'V_KR016_01', detail: 'Photocard 3', left: 303, top: 324, width: 107, height: 170 },
  { versionId: 'V_KR016_01', detail: 'Photocard 4', left: 416, top: 324, width: 108, height: 170 },
  { versionId: 'V_KR016_02', detail: 'Photocard 1', left: 583, top: 324, width: 108, height: 170 },
  { versionId: 'V_KR016_02', detail: 'Photocard 2', left: 697, top: 324, width: 107, height: 170 },
  { versionId: 'V_KR016_02', detail: 'Photocard 3', left: 817, top: 324, width: 107, height: 170 },
  { versionId: 'V_KR016_02', detail: 'Photocard 4', left: 930, top: 324, width: 107, height: 170 },
  { versionId: 'V_KR016_03', detail: 'Photocard 1', left: 1085, top: 324, width: 107, height: 172 },
  { versionId: 'V_KR016_03', detail: 'Photocard 2', left: 1198, top: 324, width: 107, height: 172 },
  { versionId: 'V_KR016_03', detail: 'Photocard 3', left: 1315, top: 324, width: 107, height: 172 },
  { versionId: 'V_KR016_03', detail: 'Photocard 4', left: 1428, top: 324, width: 107, height: 172 },
  { versionId: 'V_KR016_04', detail: 'Photocard 1', left: 76,  top: 870, width: 108, height: 217 },
  { versionId: 'V_KR016_04', detail: 'Photocard 2', left: 190, top: 870, width: 107, height: 217 },
  { versionId: 'V_KR016_04', detail: 'Photocard 3', left: 305, top: 870, width: 107, height: 217 },
  { versionId: 'V_KR016_04', detail: 'Photocard 4', left: 420, top: 870, width: 107, height: 217 },
]

// Prefer the (1) suffix version (higher quality?) when both exist
const files = readdirSync(REFS).filter(f => /_A\d{6}(\(1\))?\.(jpg|png)$/.test(f))
const seen = new Set()
const chosen = []
for (const f of files) {
  const mid = f.match(/_(A\d{6})(\(1\))?\./)[1]
  if (seen.has(mid)) continue
  seen.add(mid)
  // Prefer non-(1) if exists, else (1)
  const nonParen = files.find(x => x.match(/_(A\d{6})\./)?.[1] === mid && !x.includes('(1)'))
  chosen.push(nonParen || f)
}

let done = 0
for (const file of chosen) {
  const mid = file.match(/_(A\d{6})/)[1]
  const buf = readFileSync(`${REFS}\\${file}`)
  const meta = await sharp(buf).metadata()
  const sx = meta.width / TS.width, sy = meta.height / TS.height
  for (const c of CARDS) {
    const { data: rows } = await s.from('card_master').select('id, front_image_url').eq('version_id', c.versionId).eq('member_id', mid).eq('card_type', 'photocard').ilike('card_detail', c.detail)
    if (!rows?.length) continue
    const row = rows[0]; if (row.front_image_url) continue
    try {
      const cropped = await sharp(buf).extract({ left: Math.round(c.left * sx), top: Math.round(c.top * sy), width: Math.round(c.width * sx), height: Math.round(c.height * sy) }).toBuffer()
      const cm = await sharp(cropped).metadata()
      const w = await sharp({ create: { width: cm.width, height: cm.height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.3 } } }).png().toBuffer()
      const fin = await sharp(cropped).composite([{ input: w, blend: 'over' }]).webp({ quality: 85 }).toBuffer()
      const path = `masters/${row.id}.webp`
      await s.storage.from('card-images').upload(path, fin, { contentType: 'image/webp', upsert: true })
      const { data: u } = s.storage.from('card-images').getPublicUrl(path)
      await s.from('card_master').update({ front_image_url: u.publicUrl + `?v=${Date.now()}` }).eq('id', row.id)
      done++
    } catch (e) { console.error(`${row.id}:`, e.message) }
  }
  console.log(`  ✓ ${mid} (${file})`)
}
console.log(`total: ${done}`)
