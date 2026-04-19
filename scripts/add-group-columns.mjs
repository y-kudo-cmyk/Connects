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

const DDL = `
ALTER TABLE card_products
  ADD COLUMN IF NOT EXISTS group_id text DEFAULT 'A000001',
  ADD COLUMN IF NOT EXISTS group_name text DEFAULT 'SEVENTEEN';

UPDATE card_products
  SET group_id = 'A000001', group_name = 'SEVENTEEN'
  WHERE group_id IS NULL OR group_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_card_products_group_id ON card_products(group_id);
`

const { error } = await supabase.rpc('exec_sql', { sql: DDL })
if (error) {
  console.error('exec_sql RPC failed:', error.message)
  console.log('')
  console.log('Run this SQL in Supabase SQL Editor manually:')
  console.log(DDL)
  process.exit(1)
}
console.log('ALTER/UPDATE/INDEX applied.')

const { data } = await supabase
  .from('card_products')
  .select('product_id, product_name, group_id, group_name')
  .limit(5)
console.log('Sample rows:')
console.table(data)
