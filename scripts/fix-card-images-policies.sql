-- Supabase SQL Editor で実行
-- card-images バケットの RLS ポリシー差し替え（緩い版：認証済ユーザーなら誰でもOK）

-- 既存ポリシーを削除（名前が違っても動くように IF EXISTS）
DROP POLICY IF EXISTS "Users can upload their own card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own card images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view card images" ON storage.objects;

-- 認証ユーザーはアップロード可能（path指定なしで緩く）
CREATE POLICY "card-images insert (authenticated)"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'card-images');

-- 認証ユーザーは更新可能
CREATE POLICY "card-images update (authenticated)"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'card-images')
WITH CHECK (bucket_id = 'card-images');

-- 認証ユーザーは削除可能
CREATE POLICY "card-images delete (authenticated)"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'card-images');

-- 誰でも閲覧可能（public bucketだが明示）
CREATE POLICY "card-images select (public)"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'card-images');
