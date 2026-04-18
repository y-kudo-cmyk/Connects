-- Supabase SQL Editor で実行
-- profiles に言語選択済みフラグを追加

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language_selected boolean DEFAULT false;
