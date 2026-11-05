-- Klokk Phase 1.2: participant marketing consent and organiser CRM connections.
--
-- 1. Each response records two separate, unticked-by-default consents:
--    - klokk_marketing_consent:      Klokk (Pegasus Apps) may contact the person about Klokk.
--    - organiser_marketing_consent:  the event organiser may contact the person about other
--                                    events, marketing, newsletters and so on.
--    Only people who tick a box are added to the matching CRM.
-- 2. crm_connections holds an organiser's own CRM link (HighLevel first). The access token is
--    stored encrypted by the server; it is never readable from the browser.
-- 3. crm_sync_log records each push so a failed delivery is visible to the organiser.
-- Idempotent: safe to run more than once.

ALTER TABLE public.participant_responses
  ADD COLUMN IF NOT EXISTS klokk_marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organiser_marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_recorded_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_version text;

CREATE TABLE IF NOT EXISTS public.crm_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('highlevel')),
  external_account_id text NOT NULL,          -- HighLevel location id
  token_ciphertext text NOT NULL,             -- AES-GCM, key held in the server environment
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error')),
  last_error text,
  last_success_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS public.crm_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  response_id uuid,
  event_id uuid,
  status text NOT NULL CHECK (status IN ('ok', 'failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_sync_log_user_created_idx
  ON public.crm_sync_log (user_id, created_at DESC);

-- Row-level security. The browser never reads or writes crm_connections: every access goes
-- through server functions using the service role. No policies means no client access.
ALTER TABLE public.crm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_connections FROM anon, authenticated;
REVOKE ALL ON public.crm_sync_log FROM anon, authenticated;

-- Organiser consent captured at sign-up: Klokk may contact the organiser about Klokk.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_consent_version text;
