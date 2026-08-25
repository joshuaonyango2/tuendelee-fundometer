ALTER TABLE public.fundraising_events
  ADD COLUMN IF NOT EXISTS title_it text,
  ADD COLUMN IF NOT EXISTS title_fr text,
  ADD COLUMN IF NOT EXISTS title_sw text,
  ADD COLUMN IF NOT EXISTS description_it text,
  ADD COLUMN IF NOT EXISTS description_fr text,
  ADD COLUMN IF NOT EXISTS description_sw text;