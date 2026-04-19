-- Supabase Dashboard SQL Editor で実行
-- auth.users.email から profiles.mail へバックフィル
UPDATE profiles p
SET mail = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.mail IS NULL OR p.mail = '')
  AND u.email IS NOT NULL
  AND u.email <> '';

-- 結果確認
SELECT count(*) FILTER (WHERE mail IS NULL OR mail = '') AS null_mail,
       count(*) AS total
FROM profiles;
