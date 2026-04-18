-- Track Glide-era submitter email when the spot was imported before that user signed up to Connects+
ALTER TABLE public.spots
  ADD COLUMN IF NOT EXISTS original_submitter_email text;

CREATE INDEX IF NOT EXISTS spots_original_submitter_email_idx
  ON public.spots (original_submitter_email)
  WHERE original_submitter_email IS NOT NULL;
