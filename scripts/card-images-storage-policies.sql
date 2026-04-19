-- Supabase SQL Editor で実行
-- card-images バケットのRLSポリシー

-- 認証ユーザーは自分のフォルダ(cards/{userId}/...) にアップロード可能
create policy "Users can upload their own card images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'card-images'
  and (storage.foldername(name))[1] = 'cards'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 認証ユーザーは自分のファイルを更新可能
create policy "Users can update their own card images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'card-images'
  and (storage.foldername(name))[1] = 'cards'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 認証ユーザーは自分のファイルを削除可能
create policy "Users can delete their own card images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'card-images'
  and (storage.foldername(name))[1] = 'cards'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 画像閲覧は全員可能（public bucketなので実質不要だが明示）
create policy "Anyone can view card images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'card-images');
