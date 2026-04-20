-- 各テーブルに deleted_at timestamptz カラムを追加して soft delete 化
-- Supabase Dashboard → SQL Editor で実行してください。

ALTER TABLE my_entries          ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE todos               ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE fan_club_memberships ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- インデックス（未削除行の検索高速化）
CREATE INDEX IF NOT EXISTS idx_my_entries_active          ON my_entries (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_todos_active               ON todos (user_id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fan_club_memberships_active ON fan_club_memberships (user_id) WHERE deleted_at IS NULL;
