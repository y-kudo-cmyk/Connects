-- my_entries に「ユーザー独自時刻」列を追加
-- 元イベントの時刻が変更されても、ユーザーが個別に時刻を設定している場合は
-- そちらを優先して表示するため。

ALTER TABLE my_entries
  ADD COLUMN IF NOT EXISTS user_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS user_end_date   timestamptz;

COMMENT ON COLUMN my_entries.user_start_date IS 'ユーザー独自の開始時刻。NULL の場合は events.start_date の最新値を使用';
COMMENT ON COLUMN my_entries.user_end_date   IS 'ユーザー独自の終了時刻。NULL の場合は events.end_date の最新値を使用';
