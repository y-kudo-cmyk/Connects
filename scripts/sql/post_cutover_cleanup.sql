-- 4/26 Glide 移行完了後にクリーンアップするスキーマ変更
-- Supabase Dashboard → SQL Editor で順に実行してください。

-- 1. spots.original_submitter_email を削除
--    Glide 時代の投稿者メアドは既に各ユーザーサインアップ時に
--    submitted_by にマイグレート済み。4/26 以降は新規登録も無いため不要。
--    念のため残存件数を確認してから DROP。
DO $$
DECLARE remaining int;
BEGIN
  SELECT COUNT(*) INTO remaining FROM public.spots WHERE original_submitter_email IS NOT NULL;
  RAISE NOTICE 'spots.original_submitter_email remaining: %', remaining;
  IF remaining > 0 THEN
    RAISE NOTICE '未移行ユーザー由来の値がまだ残っています。DROP する前に手動でユーザーマッピングを確認するか、null クリアしてください。';
  END IF;
END $$;

-- 残件が 0 or 無視してよい場合は以下を有効化して実行：
-- DROP INDEX IF EXISTS public.spots_original_submitter_email_idx;
-- ALTER TABLE public.spots DROP COLUMN IF EXISTS original_submitter_email;

-- 2. glide_users テーブル自体の退避（参照箇所が無くなったら）
-- 保管用に _legacy にリネーム：
-- ALTER TABLE IF EXISTS public.glide_users RENAME TO glide_users_legacy_20260426;

-- 3. glide_my_entries も移行完了後は退避：
-- ALTER TABLE IF EXISTS public.glide_my_entries RENAME TO glide_my_entries_legacy_20260426;
