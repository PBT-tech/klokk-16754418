CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.rate_limits AS r (key, window_start, count)
  VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE SET
    window_start = CASE WHEN r.window_start < now() - make_interval(secs => p_window_seconds)
                        THEN now() ELSE r.window_start END,
    count = CASE WHEN r.window_start < now() - make_interval(secs => p_window_seconds)
                 THEN 1 ELSE r.count + 1 END
  RETURNING r.count INTO v_count;
  RETURN v_count <= p_max;
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day' $$;

CREATE OR REPLACE FUNCTION public.apply_billing_order(p_user uuid, p_order text, p_grants jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  g jsonb;
BEGIN
  INSERT INTO public.billing_orders (order_id, user_id, summary)
  VALUES (p_order, p_user, p_grants)
  ON CONFLICT (order_id) DO NOTHING;
  IF NOT FOUND THEN
    RETURN false; -- already applied
  END IF;

  FOR g IN SELECT * FROM jsonb_array_elements(p_grants) LOOP
    IF g->>'kind' = 'pack' THEN
      INSERT INTO public.event_credit_packs (user_id, order_id, events_total, purchased_at, expires_at)
      VALUES (p_user, p_order || ':' || (g->>'priceId'),
              (g->>'events')::int * (g->>'qty')::int, now(), now() + interval '3 months');
      UPDATE public.profiles SET plan = 'casual' WHERE id = p_user AND plan = 'free';
    ELSIF g->>'kind' = 'subscription' THEN
      UPDATE public.profiles SET
        plan = g->>'plan',
        billing_interval = g->>'interval',
        plan_renews_at = now() + CASE WHEN g->>'interval' = 'year' THEN interval '1 year' ELSE interval '1 month' END,
        billing_status = 'active'
      WHERE id = p_user;
    ELSIF g->>'kind' = 'seat' THEN
      UPDATE public.profiles SET extra_seats = extra_seats + (g->>'qty')::int WHERE id = p_user;
    END IF;
  END LOOP;
  RETURN true;
END;
$$;

ALTER FUNCTION public.enforce_event_limits() SET search_path = public, pg_temp;
ALTER FUNCTION public.enforce_participant_cap() SET search_path = public, pg_temp;
ALTER FUNCTION public.purge_expired_events() SET search_path = public, pg_temp;
ALTER FUNCTION public.expire_overdue_events() SET search_path = public, pg_temp;

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