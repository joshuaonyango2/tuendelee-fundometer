ALTER TABLE public.fundraising_events ADD COLUMN IF NOT EXISTS sender_name text;

CREATE TABLE public.bank_statement_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.fundraising_events(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  file_name text NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  row_count integer NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_statement_imports TO authenticated;
GRANT ALL ON public.bank_statement_imports TO service_role;
ALTER TABLE public.bank_statement_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event admins manage their imports"
ON public.bank_statement_imports FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.fundraising_events fe WHERE fe.id = event_id AND fe.admin_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.fundraising_events fe WHERE fe.id = event_id AND fe.admin_id = auth.uid()));

CREATE TRIGGER update_bank_statement_imports_updated_at
BEFORE UPDATE ON public.bank_statement_imports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.bank_statement_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id uuid NOT NULL REFERENCES public.bank_statement_imports(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.fundraising_events(id) ON DELETE CASCADE,
  txn_date date,
  reference text,
  description text,
  payer_name text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  match_status text NOT NULL DEFAULT 'unmatched',
  match_reason text,
  matched_pledge_id uuid REFERENCES public.event_pledges(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX bank_statement_entries_event_idx ON public.bank_statement_entries(event_id);
CREATE INDEX bank_statement_entries_import_idx ON public.bank_statement_entries(import_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_statement_entries TO authenticated;
GRANT ALL ON public.bank_statement_entries TO service_role;
ALTER TABLE public.bank_statement_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event admins manage their bank entries"
ON public.bank_statement_entries FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.fundraising_events fe WHERE fe.id = event_id AND fe.admin_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.fundraising_events fe WHERE fe.id = event_id AND fe.admin_id = auth.uid()));

CREATE TRIGGER update_bank_statement_entries_updated_at
BEFORE UPDATE ON public.bank_statement_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.reconcile_bank_entries(p_event_id uuid)
RETURNS TABLE(matched integer, unmatched integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_matched integer := 0;
  v_unmatched integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = p_event_id AND fe.admin_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to reconcile this event';
  END IF;

  UPDATE public.bank_statement_entries
  SET matched_pledge_id = NULL, match_status = 'unmatched', match_reason = NULL
  WHERE event_id = p_event_id;

  -- 1) Match on normalised transaction reference
  UPDATE public.bank_statement_entries e
  SET matched_pledge_id = m.pledge_id,
      match_status = 'matched',
      match_reason = 'reference'
  FROM (
    SELECT DISTINCT ON (e2.id) e2.id AS entry_id, ep.id AS pledge_id
    FROM public.bank_statement_entries e2
    JOIN public.event_pledges ep ON ep.event_id = e2.event_id
    WHERE e2.event_id = p_event_id
      AND coalesce(btrim(e2.reference), '') <> ''
      AND coalesce(btrim(ep.payment_reference), '') <> ''
      AND upper(regexp_replace(e2.reference, '[^A-Za-z0-9]', '', 'g'))
          = upper(regexp_replace(ep.payment_reference, '[^A-Za-z0-9]', '', 'g'))
    ORDER BY e2.id, ep.created_at
  ) m
  WHERE e.id = m.entry_id;

  -- 2) Fallback: payer name + exact amount
  UPDATE public.bank_statement_entries e
  SET matched_pledge_id = m.pledge_id,
      match_status = 'matched',
      match_reason = 'name_amount'
  FROM (
    SELECT DISTINCT ON (e2.id) e2.id AS entry_id, ep.id AS pledge_id
    FROM public.bank_statement_entries e2
    JOIN public.event_pledges ep ON ep.event_id = e2.event_id
    WHERE e2.event_id = p_event_id
      AND e2.match_status = 'unmatched'
      AND coalesce(btrim(e2.payer_name), '') <> ''
      AND round(ep.amount, 2) = round(e2.amount, 2)
      AND (
        lower(btrim(ep.name)) = lower(btrim(e2.payer_name))
        OR lower(btrim(e2.payer_name)) LIKE '%' || lower(btrim(ep.name)) || '%'
        OR lower(btrim(ep.name)) LIKE '%' || lower(btrim(e2.payer_name)) || '%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.bank_statement_entries e3
        WHERE e3.event_id = p_event_id AND e3.matched_pledge_id = ep.id
      )
    ORDER BY e2.id, ep.created_at
  ) m
  WHERE e.id = m.entry_id;

  SELECT count(*) FILTER (WHERE match_status = 'matched'),
         count(*) FILTER (WHERE match_status <> 'matched')
  INTO v_matched, v_unmatched
  FROM public.bank_statement_entries
  WHERE event_id = p_event_id;

  RETURN QUERY SELECT coalesce(v_matched, 0), coalesce(v_unmatched, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_bank_entries(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reconcile_bank_entries(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_reconciliation_summary(p_event_id uuid)
RETURNS TABLE(
  bank_total numeric,
  bank_entries integer,
  matched_total numeric,
  matched_entries integer,
  unmatched_bank_total numeric,
  unmatched_bank_entries integer,
  system_paid_total numeric,
  system_paid_count integer,
  paid_not_in_bank_total numeric,
  paid_not_in_bank_count integer,
  pending_total numeric,
  pending_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.fundraising_events fe
    WHERE fe.id = p_event_id AND fe.admin_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this event';
  END IF;

  RETURN QUERY
  WITH e AS (
    SELECT * FROM public.bank_statement_entries WHERE event_id = p_event_id
  ), p AS (
    SELECT * FROM public.event_pledges WHERE event_id = p_event_id AND is_archived = false
  )
  SELECT
    coalesce((SELECT sum(amount) FROM e), 0),
    (SELECT count(*)::int FROM e),
    coalesce((SELECT sum(amount) FROM e WHERE match_status = 'matched'), 0),
    (SELECT count(*)::int FROM e WHERE match_status = 'matched'),
    coalesce((SELECT sum(amount) FROM e WHERE match_status <> 'matched'), 0),
    (SELECT count(*)::int FROM e WHERE match_status <> 'matched'),
    coalesce((SELECT sum(amount) FROM p WHERE is_confirmed = true), 0),
    (SELECT count(*)::int FROM p WHERE is_confirmed = true),
    coalesce((SELECT sum(amount) FROM p WHERE is_confirmed = true
      AND NOT EXISTS (SELECT 1 FROM e WHERE e.matched_pledge_id = p.id)), 0),
    (SELECT count(*)::int FROM p WHERE is_confirmed = true
      AND NOT EXISTS (SELECT 1 FROM e WHERE e.matched_pledge_id = p.id)),
    coalesce((SELECT sum(amount) FROM p WHERE is_confirmed = false), 0),
    (SELECT count(*)::int FROM p WHERE is_confirmed = false);
END;
$$;

REVOKE ALL ON FUNCTION public.get_reconciliation_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_reconciliation_summary(uuid) TO authenticated, service_role;