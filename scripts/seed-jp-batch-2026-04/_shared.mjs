// Shared helpers for the 2026-04 JP seed batch.
// - Loads Supabase credentials from .env.local
// - Exports MEMBERS list in A000001..A000013 order
// - Provides idempotent upsert helpers for card_versions and card_master
//
// Card-master row IDs are deterministic: `CM_{PID}_{VSUFFIX}_{SLUG}_{MEMBER_ID}[_{i}]`
// so re-running is safe (PK collisions on `id` are upserted no-op).

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const envFile = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8')
for (const l of envFile.split('\n')) {
  const m = l.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

export const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// SEVENTEEN member IDs in the canonical A000001..A000013 order, matching
// `seventeenMembers` in lib/config/constants.ts.
export const MEMBERS = [
  { id: 'A000001', name: 'S.COUPS' },
  { id: 'A000002', name: 'JEONGHAN' },
  { id: 'A000003', name: 'JOSHUA' },
  { id: 'A000004', name: 'JUN' },
  { id: 'A000005', name: 'HOSHI' },
  { id: 'A000006', name: 'WONWOO' },
  { id: 'A000007', name: 'WOOZI' },
  { id: 'A000008', name: 'THE 8' },
  { id: 'A000009', name: 'MINGYU' },
  { id: 'A000010', name: 'DK' },
  { id: 'A000011', name: 'SEUNGKWAN' },
  { id: 'A000012', name: 'VERNON' },
  { id: 'A000013', name: 'DINO' },
]

// Upsert one card_version (idempotent by version_id PK). Returns true if a new
// row was inserted, false if the version already existed.
export async function ensureVersion({ version_id, product_id, version_name, tier, sort_order }) {
  const { data: existing } = await s
    .from('card_versions')
    .select('version_id, version_name, tier, sort_order')
    .eq('version_id', version_id)
    .maybeSingle()
  if (existing) return { created: false, existing }
  const { error } = await s.from('card_versions').insert({
    version_id, product_id, version_name, tier, sort_order,
  })
  if (error) throw new Error(`insert version ${version_id}: ${error.message}`)
  return { created: true }
}

// Upsert card_master rows keyed by deterministic id. Returns counts.
export async function upsertCards(rows) {
  if (!rows.length) return { added: 0, existed: 0 }
  const ids = rows.map(r => r.id)
  const { data: present } = await s
    .from('card_master')
    .select('id')
    .in('id', ids)
  const presentSet = new Set((present ?? []).map(r => r.id))
  const newRows = rows.filter(r => !presentSet.has(r.id))
  if (newRows.length) {
    const { error } = await s.from('card_master').insert(newRows)
    if (error) throw new Error(`insert card_master: ${error.message}`)
  }
  return { added: newRows.length, existed: presentSet.size }
}

// Build card rows for a `(version_id, card_detail, card_type)` spec, one per
// member × per `count` duplicates (for "n cards per member" benefits).
// `idSuffix` is used to build deterministic `CM_<PID>_<idSuffix>[_i]_<memberId>`.
export function buildMemberCards({ product_id, version_id, member_id_of_pid_suffix, idSuffix, cardDetailBase, card_type, count = 1 }) {
  const rows = []
  for (const m of MEMBERS) {
    for (let i = 1; i <= count; i++) {
      const suffixI = count > 1 ? `_${i}` : ''
      rows.push({
        id: `CM_${product_id}_${idSuffix}${suffixI}_${m.id}`,
        product_id,
        version_id,
        member_id: m.id,
        member_name: m.name,
        card_type,
        card_detail: count > 1 ? `${cardDetailBase} ${i}` : cardDetailBase,
        front_image_url: '',
        back_image_url: '',
      })
    }
  }
  return rows
}

export async function summarizeProduct(product_id) {
  const { data: vers } = await s
    .from('card_versions')
    .select('version_id, version_name, tier, sort_order')
    .eq('product_id', product_id)
    .order('tier', { ascending: true, nullsFirst: true })
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('version_id')
  console.log(`\n--- final state for ${product_id} ---`)
  let total = 0
  for (const v of vers ?? []) {
    const { count } = await s
      .from('card_master')
      .select('id', { count: 'exact', head: true })
      .eq('version_id', v.version_id)
    total += count ?? 0
    console.log(`  ${v.version_id} | tier=${v.tier} | sort=${v.sort_order} | ${v.version_name} | cards=${count}`)
  }
  console.log(`  => versions=${vers?.length ?? 0}, card_master=${total}`)
  return { versions: vers?.length ?? 0, cards: total }
}
