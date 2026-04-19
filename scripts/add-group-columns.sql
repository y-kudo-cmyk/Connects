-- Supabase SQL Editor で実行
-- card_products に group_id / group_name を追加し、既存レコードにSEVENTEENを設定

ALTER TABLE card_products
  ADD COLUMN IF NOT EXISTS group_id text DEFAULT 'A000001',
  ADD COLUMN IF NOT EXISTS group_name text DEFAULT 'SEVENTEEN';

UPDATE card_products
  SET group_id = 'A000001', group_name = 'SEVENTEEN'
  WHERE group_id IS NULL OR group_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_card_products_group_id ON card_products(group_id);
