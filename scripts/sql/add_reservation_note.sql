-- my_entries に reservation_note カラムを追加 (予約番号フィールド)
-- Supabase Dashboard の SQL Editor で実行してください
ALTER TABLE my_entries ADD COLUMN IF NOT EXISTS reservation_note text;
