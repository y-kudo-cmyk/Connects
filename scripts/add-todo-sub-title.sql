ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS sub_title text;
