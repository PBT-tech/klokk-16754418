CREATE OR REPLACE FUNCTION public.sync_profile_email_verified()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  UPDATE public.profiles SET email_verified = (NEW.email_confirmed_at IS NOT NULL) WHERE id = NEW.id;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.sync_profile_email_verified() FROM PUBLIC, anon, authenticated;

-- Cloud's auth schema is read-only. The only permitted repair there is dropping a bad trigger.
-- We do NOT create a replacement trigger on auth.users; profiles.email_verified is synced app-side on sign-in.
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

DROP TRIGGER IF EXISTS profiles_protect_privileged ON public.profiles;
CREATE TRIGGER profiles_protect_privileged
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_privileged();

-- One-time backfill: reflect current email-confirmation state.
UPDATE public.profiles p SET email_verified = (u.email_confirmed_at IS NOT NULL)
FROM auth.users u WHERE u.id = p.id
  AND p.email_verified IS DISTINCT FROM (u.email_confirmed_at IS NOT NULL);