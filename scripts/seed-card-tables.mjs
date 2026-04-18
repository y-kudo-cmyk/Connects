/**
 * seed-card-tables.mjs
 * ---
 * Seeds card_products, card_versions, card_master tables from CSV files.
 *
 * PREREQUISITE: Run the DDL in docs/supabase-schema.sql (card tables section)
 *               via the Supabase SQL Editor first.
 *
 * Usage:  node scripts/seed-card-tables.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── env ─────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env.local')
    const lines = readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) process.env[m[1]] = process.env[m[1]] || m[2].trim()
    }
  } catch { /* ignore */ }
}
loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── CSV parser (handles quoted fields) ─────────────────────────
function parseCSV(text) {
  const rows = []
  const lines = text.split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const row = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') { inQuote = !inQuote; continue }
      if (c === ',' && !inQuote) { row.push(cur); cur = ''; continue }
      cur += c
    }
    row.push(cur.replace(/\r$/, ''))
    rows.push(row)
  }
  const headers = rows.shift()
  return rows.map(r => {
    const obj = {}
    headers.forEach((h, i) => { obj[h.trim()] = (r[i] || '').trim() })
    return obj
  })
}

// ── Check tables exist ─────────────────────────────────────────
async function checkTables() {
  const { error } = await supabase.from('card_products').select('product_id').limit(1)
  if (error) {
    console.error('ERROR: card_products table not found.')
    console.error('Please run the DDL from docs/supabase-schema.sql in the Supabase SQL Editor first.')
    console.error('Look for the section: "-- トレカデジタルアルバム"')
    process.exit(1)
  }
  console.log('Tables verified.')
}

// ── Seed card_products ─────────────────────────────────────────
async function seedProducts() {
  console.log('Seeding card_products...')
  const csv = readFileSync(resolve(__dirname, 'album_master.csv'), 'utf-8')
  const rows = parseCSV(csv)

  const products = rows.map(r => ({
    product_id: r.product_id,
    product_name: r.product_name,
    product_type: r.product_type,
    region: r.region,
    release_date: r.release_date || null,
    artist_id: 'A000000',
    image_url: '',
  }))

  for (let i = 0; i < products.length; i += 50) {
    const batch = products.slice(i, i + 50)
    const { error } = await supabase.from('card_products').upsert(batch, { onConflict: 'product_id' })
    if (error) {
      console.error('card_products error:', error.message)
      return false
    }
  }
  console.log(`  ${products.length} products upserted`)
  return true
}

// ── Seed card_versions ─────────────────────────────────────────
async function seedVersions() {
  console.log('Seeding card_versions...')
  const csv = readFileSync(resolve(__dirname, 'album_master.csv'), 'utf-8')
  const rows = parseCSV(csv)

  const versions = []
  for (const r of rows) {
    const versionNames = (r.versions || '').split(';').map(v => v.trim()).filter(Boolean)
    versionNames.forEach((vn, idx) => {
      const versionId = `V_${r.product_id.replace('P_', '')}_${String(idx + 1).padStart(2, '0')}`
      versions.push({
        version_id: versionId,
        product_id: r.product_id,
        version_name: vn,
      })
    })
  }

  for (let i = 0; i < versions.length; i += 50) {
    const batch = versions.slice(i, i + 50)
    const { error } = await supabase.from('card_versions').upsert(batch, { onConflict: 'version_id' })
    if (error) {
      console.error('card_versions error:', error.message)
      return false
    }
  }
  console.log(`  ${versions.length} versions upserted`)
  return true
}

// ── Seed card_master ───────────────────────────────────────────
async function seedCardMaster() {
  console.log('Seeding card_master...')
  const csv = readFileSync(resolve(__dirname, 'card_master_raw.csv'), 'utf-8')
  const rows = parseCSV(csv)

  const cards = rows.map(r => ({
    id: r.product_master_id,
    product_id: r.product_id,
    version_id: r.version_id || null,
    member_id: r.member_id || '',
    member_name: r.member_name || '',
    card_type: r.card_type || 'photocard',
    card_detail: r.card_detail || '',
    front_image_url: r.front_image_url || '',
    back_image_url: r.back_image_url || '',
  }))

  let successCount = 0
  for (let i = 0; i < cards.length; i += 100) {
    const batch = cards.slice(i, i + 100)
    const { error } = await supabase.from('card_master').upsert(batch, { onConflict: 'id' })
    if (error) {
      console.error(`card_master batch ${i} error:`, error.message)
    } else {
      successCount += batch.length
    }
  }
  console.log(`  ${successCount}/${cards.length} card master records upserted`)
  return true
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('=== Card Tables Seed Script ===')
  console.log(`Supabase: ${SUPABASE_URL}`)
  console.log('')

  await checkTables()
  const p = await seedProducts()
  if (!p) return
  const v = await seedVersions()
  if (!v) return
  await seedCardMaster()

  console.log('')
  console.log('Done!')
}

main().catch(e => { console.error(e); process.exit(1) })
