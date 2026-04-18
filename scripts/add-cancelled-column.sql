ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cancelled boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS events_cancelled_idx
  ON public.events (cancelled)
  WHERE cancelled = true;
