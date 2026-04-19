-- 各ユーザー・各カードの「欲しい枚数」
-- null = デフォルトロジック（推し=1 / 推し外=0）を適用
-- 明示値 = その数を使って 譲（所持-wanted>0） / 求（wanted-所持>0） を計算
ALTER TABLE public.user_cards
  ADD COLUMN IF NOT EXISTS wanted_count int;

-- 検索効率のため wanted_count で絞り込むクエリ用インデックス
CREATE INDEX IF NOT EXISTS user_cards_wanted_idx
  ON public.user_cards(user_id, wanted_count);
