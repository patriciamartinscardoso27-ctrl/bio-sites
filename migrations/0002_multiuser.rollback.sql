-- PREPARED ONLY. Revert application to legacy mode first. Never discard buyer data.
BEGIN;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.biosite_users WHERE role='buyer')
 OR EXISTS(SELECT 1 FROM public.biosite_invitations)
 OR EXISTS(SELECT 1 FROM public.biosite_user_events) THEN
 RAISE EXCEPTION 'Rollback requires preservation plan: buyer accounts or invitations exist'; END IF;
END $$;
DROP TRIGGER biosite_assign_owner ON public.biosites;
DROP POLICY multi_admin ON public.biosite_admin;
DROP POLICY multi_sites_read ON public.biosites;
DROP POLICY multi_sites_insert ON public.biosites;
DROP POLICY multi_sites_update ON public.biosites;
DROP POLICY multi_revision_read ON public.biosite_revisions;
DROP POLICY multi_revision_insert ON public.biosite_revisions;
DROP POLICY multi_assets ON public.biosite_assets;
DROP POLICY multi_users ON public.biosite_users;
DROP TABLE public.biosite_user_events,public.biosite_invitations,public.biosite_ownership;
DROP FUNCTION public.biosite_assign_owner(),public.biosite_public_revision(uuid,bigint),public.biosite_owns(uuid),public.biosite_is_principal(),public.biosite_actor();
DROP TABLE public.biosite_users;
DROP OWNED BY biosites_app_runtime;
DROP ROLE biosites_app_runtime;
COMMIT;
