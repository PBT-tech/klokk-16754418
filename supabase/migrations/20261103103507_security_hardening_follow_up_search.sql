ALTER FUNCTION public.enforce_event_limits() SET search_path = public, pg_temp;
ALTER FUNCTION public.enforce_participant_cap() SET search_path = public, pg_temp;
ALTER FUNCTION public.purge_expired_events() SET search_path = public, pg_temp;
ALTER FUNCTION public.expire_overdue_events() SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.enforce_event_limits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_participant_cap() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_protect_privileged() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.events_protect_immutable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.purge_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_billing_order(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_rate_limits() TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_billing_order(uuid, text, jsonb) TO service_role;

-- Participant editing own response when event is full
CREATE OR REPLACE FUNCTION public.enforce_participant_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan text;
  v_cap int;
  v_count int;
BEGIN
  SELECT coalesce(p.plan, 'free') INTO v_plan
    FROM public.events e JOIN public.profiles p ON p.id = e.owner_id
    WHERE e.id = NEW.event_id;

  v_cap := CASE v_plan WHEN 'free' THEN 35 WHEN 'organiser' THEN 80 ELSE NULL END;
  IF v_cap IS NULL THEN
    RETURN NEW; -- casual (overage billed) and teams (unlimited)
  END IF;

  IF TG_TABLE_NAME = 'participant_responses' THEN
    IF EXISTS (SELECT 1 FROM public.participant_responses
               WHERE event_id = NEW.event_id AND email = NEW.email) THEN
      RETURN NEW; -- an edit (the upsert will update this row), not a new participant
    END IF;
    SELECT count(*) INTO v_count FROM public.participant_responses WHERE event_id = NEW.event_id;
  ELSE
    SELECT count(*) INTO v_count FROM public.named_participants WHERE event_id = NEW.event_id;
  END IF;

  IF v_count >= v_cap THEN
    RAISE EXCEPTION 'Participant limit reached (% on this plan)', v_cap USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_participant_cap() FROM PUBLIC, anon, authenticated;