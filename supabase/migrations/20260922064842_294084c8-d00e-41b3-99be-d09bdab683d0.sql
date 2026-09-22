CREATE TABLE public.event_custom_texts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.fundraising_events(id) ON DELETE CASCADE,
  text_key text NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (event_id, text_key)
);

GRANT SELECT ON public.event_custom_texts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_custom_texts TO authenticated;
GRANT ALL ON public.event_custom_texts TO service_role;

ALTER TABLE public.event_custom_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read custom event texts"
  ON public.event_custom_texts FOR SELECT
  USING (true);

CREATE POLICY "Event admin can insert custom texts"
  ON public.event_custom_texts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = event_id AND fe.admin_id = auth.uid()
  ));

CREATE POLICY "Event admin can update custom texts"
  ON public.event_custom_texts FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = event_id AND fe.admin_id = auth.uid()
  ));

CREATE POLICY "Event admin can delete custom texts"
  ON public.event_custom_texts FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = event_id AND fe.admin_id = auth.uid()
  ));

CREATE TRIGGER update_event_custom_texts_updated_at
  BEFORE UPDATE ON public.event_custom_texts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();