-- Klokk: attach the profile protection triggers.
--
-- Found on 2026-11-04: the live database had the trigger FUNCTIONS but not the
-- triggers themselves on public.profiles and auth.users, because the migration that
-- created them (20261102000000) was never applied. Without them a signed-in user can
-- change their own plan, email_verified, event counter and billing columns.
-- This migration is idempotent and safe to run more than once.

-- Keep email_verified in step with Supabase Auth.
CREATE OR REPLACE FUNCTION public.sync_profile_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  UPDATE public.profiles SET email_verified = (NEW.email_confirmed_at IS NOT NULL) WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_profile_email_verified() FROM PUBLIC, anon, authenticated;

-- Block client writes to privileged profile columns (function defined in 20261102040000).
DROP TRIGGER IF EXISTS profiles_protect_privileged ON public.profiles;
CREATE TRIGGER profiles_protect_privileged
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_privileged();

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email_verified();

-- Make existing rows correct (runs as the migration owner, so the protection trigger lets it through).
UPDATE public.profiles p
SET email_verified = (u.email_confirmed_at IS NOT NULL)
FROM auth.users u
WHERE u.id = p.id AND p.email_verified IS DISTINCT FROM (u.email_confirmed_at IS NOT NULL);
