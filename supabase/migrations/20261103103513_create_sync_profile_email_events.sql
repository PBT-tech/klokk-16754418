-- Create profile email sync trigger and function
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- Create immutable events trigger and function
CREATE OR REPLACE FUNCTION public.events_protect_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'authenticated' AND pg_trigger_depth() = 1 THEN
    NEW.token := OLD.token;
    NEW.owner_id := OLD.owner_id;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_protect_immutable ON public.events;
CREATE TRIGGER events_protect_immutable
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.events_protect_immutable();

-- Pin search paths
ALTER FUNCTION public.enforce_event_limits() SET search_path = public, pg_temp;
ALTER FUNCTION public.enforce_participant_cap() SET search_path = public, pg_temp;
ALTER FUNCTION public.purge_expired_events() SET search_path = public, pg_temp;
ALTER FUNCTION public.expire_overdue_events() SET search_path = public, pg_temp;

-- Permissions
REVOKE ALL ON FUNCTION public.enforce_event_limits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_participant_cap() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_protect_privileged() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_email() FROM PUBLIC, anon, authenticated;
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