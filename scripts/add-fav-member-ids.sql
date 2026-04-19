-- Supabase SQL Editor で実行
-- profiles に推しメンバーの配列カラムを追加

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fav_member_ids text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_profiles_fav_member_ids ON profiles USING gin(fav_member_ids);
