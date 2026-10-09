-- PREPARED ONLY. Requires explicit production approval and a verified backup.
-- Before BEGIN: SET biosites.principal_auth_id = '<existing Neon Auth Admin UUID>';
BEGIN;
DO $$ BEGIN
  IF nullif(current_setting('biosites.principal_auth_id',true),'') IS NULL THEN
    RAISE EXCEPTION 'Existing principal Auth ID is required';
  END IF;
END $$;
CREATE TABLE public.biosite_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id text UNIQUE,
  name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 150),
  email text NOT NULL UNIQUE CHECK(email=lower(btrim(email)) AND length(email)<=256),
  role text NOT NULL CHECK(role IN ('principal','buyer')),
  status text NOT NULL CHECK(status IN ('invited','active','blocked')),
  session_valid_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(role<>'principal' OR (status='active' AND auth_id IS NOT NULL))
);
CREATE UNIQUE INDEX biosite_single_principal ON public.biosite_users(role) WHERE role='principal';
INSERT INTO public.biosite_users(auth_id,name,email,role,status)
 SELECT id::text,name,lower(email),'principal','active' FROM neon_auth."user"
 WHERE id::text=current_setting('biosites.principal_auth_id');
DO $$ BEGIN IF (SELECT count(*) FROM public.biosite_users WHERE role='principal')<>1 THEN
 RAISE EXCEPTION 'Principal account not found; no changes committed'; END IF; END $$;
CREATE TABLE public.biosite_ownership (
  biosite_id uuid PRIMARY KEY REFERENCES public.biosites(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.biosite_users(id) ON DELETE RESTRICT
);
CREATE INDEX biosite_ownership_user ON public.biosite_ownership(user_id,biosite_id);
INSERT INTO public.biosite_ownership SELECT b.id,u.id FROM public.biosites b
 CROSS JOIN public.biosite_users u WHERE u.role='principal';
CREATE TABLE public.biosite_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.biosite_users(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE CHECK(token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  delivery_status text NOT NULL DEFAULT 'pending' CHECK(delivery_status IN ('pending','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX biosite_invitations_user ON public.biosite_invitations(user_id);
CREATE TABLE public.biosite_user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.biosite_users(id),
  user_id uuid NOT NULL REFERENCES public.biosite_users(id),
  action text NOT NULL CHECK(action IN ('invite','resend','block','reactivate','accept')),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- No login/DDL/delete privileges. Backend enters this role inside each data transaction.
CREATE ROLE biosites_app_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT biosites_app_runtime TO CURRENT_USER;
GRANT USAGE ON SCHEMA public TO biosites_app_runtime;
GRANT SELECT ON public.biosite_admin TO biosites_app_runtime;
GRANT SELECT,INSERT,UPDATE ON public.biosites TO biosites_app_runtime;
GRANT SELECT,INSERT ON public.biosite_revisions,public.biosite_assets TO biosites_app_runtime;
GRANT SELECT ON public.biosite_users,public.biosite_ownership TO biosites_app_runtime;
CREATE FUNCTION public.biosite_actor() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path=pg_catalog AS $$ SELECT id FROM public.biosite_users
 WHERE auth_id=nullif(current_setting('biosites.auth_id',true),'') AND status='active' $$;
CREATE FUNCTION public.biosite_is_principal() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path=pg_catalog AS $$ SELECT EXISTS(SELECT 1 FROM public.biosite_users
 WHERE id=public.biosite_actor() AND role='principal') $$;
CREATE FUNCTION public.biosite_owns(site uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path=pg_catalog AS $$ SELECT public.biosite_is_principal() OR EXISTS(
 SELECT 1 FROM public.biosite_ownership WHERE biosite_id=site AND user_id=public.biosite_actor()) $$;
CREATE FUNCTION public.biosite_public_revision(site uuid,revision bigint) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path=pg_catalog AS $$ SELECT current_setting('biosites.public',true)='yes' AND EXISTS(
 SELECT 1 FROM public.biosites WHERE id=site AND status='published' AND published_revision=revision) $$;
CREATE FUNCTION public.biosite_assign_owner() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
 SET search_path=pg_catalog AS $$ DECLARE actor uuid:=public.biosite_actor(); BEGIN
 -- Preserve legacy principal-only API during the approved migration/deploy transition.
 -- Runtime requests must always supply a real active account; no anonymous fallback.
 IF actor IS NULL AND nullif(current_setting('biosites.auth_id',true),'') IS NULL
 AND current_setting('role',true)<>'biosites_app_runtime' THEN
 SELECT id INTO actor FROM public.biosite_users WHERE role='principal' AND status='active'; END IF;
 IF actor IS NULL THEN RAISE EXCEPTION 'Active account required'; END IF;
 INSERT INTO public.biosite_ownership VALUES(NEW.id,actor); RETURN NEW; END $$;
CREATE TRIGGER biosite_assign_owner AFTER INSERT ON public.biosites FOR EACH ROW EXECUTE FUNCTION public.biosite_assign_owner();
ALTER TABLE public.biosite_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biosite_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biosite_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biosite_user_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY multi_admin ON public.biosite_admin TO biosites_app_runtime USING(public.biosite_actor() IS NOT NULL);
CREATE POLICY multi_users ON public.biosite_users TO biosites_app_runtime USING(id=public.biosite_actor() OR public.biosite_is_principal());
CREATE POLICY multi_ownership ON public.biosite_ownership TO biosites_app_runtime USING(user_id=public.biosite_actor() OR public.biosite_is_principal());
CREATE POLICY multi_sites_read ON public.biosites FOR SELECT TO biosites_app_runtime USING(
 public.biosite_owns(id) OR (current_setting('biosites.public',true)='yes' AND status='published'));
CREATE POLICY multi_sites_insert ON public.biosites FOR INSERT TO biosites_app_runtime WITH CHECK(public.biosite_actor() IS NOT NULL);
CREATE POLICY multi_sites_update ON public.biosites FOR UPDATE TO biosites_app_runtime USING(public.biosite_owns(id)) WITH CHECK(public.biosite_owns(id));
CREATE POLICY multi_revision_read ON public.biosite_revisions FOR SELECT TO biosites_app_runtime USING(public.biosite_owns(biosite_id) OR public.biosite_public_revision(biosite_id,version));
CREATE POLICY multi_revision_insert ON public.biosite_revisions FOR INSERT TO biosites_app_runtime WITH CHECK(public.biosite_owns(biosite_id));
CREATE POLICY multi_assets ON public.biosite_assets TO biosites_app_runtime USING(public.biosite_owns(biosite_id)) WITH CHECK(public.biosite_owns(biosite_id));
REVOKE ALL ON public.biosite_users,public.biosite_ownership,public.biosite_invitations,public.biosite_user_events FROM PUBLIC;
REVOKE ALL ON FUNCTION public.biosite_actor(),public.biosite_is_principal(),public.biosite_owns(uuid),public.biosite_public_revision(uuid,bigint),public.biosite_assign_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.biosite_actor(),public.biosite_is_principal(),public.biosite_owns(uuid),public.biosite_public_revision(uuid,bigint) TO biosites_app_runtime;
COMMIT;
