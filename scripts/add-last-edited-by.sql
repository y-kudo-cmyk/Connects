-- 最終更新者カラムを追加して編集履歴の可視化 + 抑止力
ALTER TABLE public.spots       ADD COLUMN IF NOT EXISTS last_edited_by uuid REFERENCES auth.users(id);
ALTER TABLE public.events      ADD COLUMN IF NOT EXISTS last_edited_by uuid REFERENCES auth.users(id);
ALTER TABLE public.spot_photos ADD COLUMN IF NOT EXISTS last_edited_by uuid REFERENCES auth.users(id);

-- 既存行を submitted_by で初期化
UPDATE public.spots       SET last_edited_by = submitted_by WHERE last_edited_by IS NULL AND submitted_by IS NOT NULL;
UPDATE public.events      SET last_edited_by = submitted_by WHERE last_edited_by IS NULL AND submitted_by IS NOT NULL;
UPDATE public.spot_photos SET last_edited_by = submitted_by WHERE last_edited_by IS NULL AND submitted_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS spots_last_edited_by_idx       ON public.spots(last_edited_by);
CREATE INDEX IF NOT EXISTS events_last_edited_by_idx      ON public.events(last_edited_by);
CREATE INDEX IF NOT EXISTS spot_photos_last_edited_by_idx ON public.spot_photos(last_edited_by);
