-- Klokk Phase 1.3: system owner role and per-event CRM connections.
-- Idempotent: safe to run more than once.

-- 1. System roles. 'owner' is the owner of the Klokk system. 'admin' is reserved for future
--    system admins with fewer powers. Teams "account admins" are a separate concept.
CREATE TABLE IF NOT EXISTS public.system_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_user_id uuid,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS system_audit_log_created_idx
  ON public.system_audit_log (created_at DESC);

-- Browser never reads or writes these; server functions use the service role.
ALTER TABLE public.system_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.system_roles FROM anon, authenticated;
REVOKE ALL ON public.system_audit_log FROM anon, authenticated;

-- 2. Several CRM connections per user, each with a label and an optional default.
ALTER TABLE public.crm_connections
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

ALTER TABLE public.crm_connections
  DROP CONSTRAINT IF EXISTS crm_connections_user_id_provider_key;

CREATE UNIQUE INDEX IF NOT EXISTS crm_connections_user_provider_account_idx
  ON public.crm_connections (user_id, provider, external_account_id);

-- Connections that existed before this change become each user's default.
UPDATE public.crm_connections c
SET is_default = true
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_connections d WHERE d.user_id = c.user_id AND d.is_default
);

ALTER TABLE public.crm_sync_log
  ADD COLUMN IF NOT EXISTS connection_id uuid;

-- 3. Per-event settings: which connection receives ticked participants, and an optional host
--    name shown in the participant tick box for events run for or with others.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS crm_connection_id uuid REFERENCES public.crm_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS host_name text;