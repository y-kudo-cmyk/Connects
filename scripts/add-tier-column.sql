-- Supabase SQL Editor で実行
-- card_versions に tier カラム追加 + 既存データのプレフィクスから自動分類

ALTER TABLE card_versions ADD COLUMN IF NOT EXISTS tier text DEFAULT 'INCLUDED';

-- 既存レコードのtier を version_id / version_name から推定
UPDATE card_versions SET tier = CASE
  WHEN version_id LIKE '%_LUCKY_%' THEN 'LUCKY_DRAW'
  WHEN version_id LIKE '%_BEN_%' OR version_id LIKE '%_BENEFIT_%' THEN 'STORE_JP'
  ELSE 'INCLUDED'
END
WHERE tier = 'INCLUDED' OR tier IS NULL;

CREATE INDEX IF NOT EXISTS idx_card_versions_tier ON card_versions(tier);
