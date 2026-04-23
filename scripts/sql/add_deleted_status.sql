-- soft-delete を機能させるため status CHECK 制約に 'deleted' を追加
-- Supabase Dashboard → SQL Editor で実行してください
--
-- 背景: 現状 status ∈ ('pending','confirmed','rejected') のみ。
-- アプリ側 ( `/api/delete-spot`, `useUserSpots.removeSpot`, `EventDetailModal` 等 ) は
-- status='deleted' に更新しようとするが CHECK 制約違反で silent fail してた。
-- 'rejected' は「承認却下」の意味合いなので、削除を表す 'deleted' を別途追加する。

-- events
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check
  CHECK (status IN ('pending', 'confirmed', 'rejected', 'deleted'));

-- spots
ALTER TABLE spots DROP CONSTRAINT IF EXISTS spots_status_check;
ALTER TABLE spots ADD CONSTRAINT spots_status_check
  CHECK (status IN ('pending', 'confirmed', 'rejected', 'deleted'));

-- spot_photos
ALTER TABLE spot_photos DROP CONSTRAINT IF EXISTS spot_photos_status_check;
ALTER TABLE spot_photos ADD CONSTRAINT spot_photos_status_check
  CHECK (status IN ('pending', 'confirmed', 'rejected', 'deleted'));

-- 実行後:
-- 1. 今後 admin の「スポット削除」「写真削除」ボタンが status='deleted' でちゃんと機能する
-- 2. 既存 'rejected' になってる SP00552 等は手動で 'deleted' に変えてもOK
