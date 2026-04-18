-- Add sort_order column to card_versions so UI can display versions
-- in the official release order (instead of alphabetical by version_id).
--
-- Run via Supabase SQL editor or `psql` before executing
-- scripts/fix-all-album-orders.mjs.
--
-- Safe to run multiple times (IF NOT EXISTS + default 0).

ALTER TABLE card_versions
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

-- Optional: index in case the UI ever filters/sorts heavily by it.
CREATE INDEX IF NOT EXISTS card_versions_product_sort_idx
  ON card_versions (product_id, sort_order, version_id);
