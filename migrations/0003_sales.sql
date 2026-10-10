-- PREPARED ONLY: requires a fresh verified backup and explicit production approval.
-- Additive; no existing rows, IDs, URLs, publications or Auth configuration are changed.
BEGIN;
CREATE UNIQUE INDEX biosite_ownership_site_user ON public.biosite_ownership(biosite_id,user_id);
CREATE TABLE public.biosite_sales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 biosite_id uuid NOT NULL UNIQUE,
 owner_id uuid NOT NULL,
 amount_cents bigint NOT NULL CHECK(amount_cents BETWEEN 1 AND 9999999999),
 sold_on date NOT NULL,
 payment_method text NOT NULL CHECK(payment_method IN ('pix','cash','card','transfer','other')),
 payment_status text NOT NULL CHECK(payment_status IN ('pending','paid')),
 notes text NOT NULL DEFAULT '' CHECK(length(notes)<=5000),
 lock_version bigint NOT NULL DEFAULT 1 CHECK(lock_version>0),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(biosite_id,owner_id) REFERENCES public.biosite_ownership(biosite_id,user_id) ON DELETE RESTRICT
);
CREATE INDEX biosite_sales_owner_date ON public.biosite_sales(owner_id,sold_on,id);
CREATE FUNCTION public.biosite_sale_guard() RETURNS trigger LANGUAGE plpgsql
 SET search_path=pg_catalog AS $$ BEGIN
 IF NEW.id<>OLD.id OR NEW.biosite_id<>OLD.biosite_id OR NEW.owner_id<>OLD.owner_id OR NEW.created_at<>OLD.created_at THEN
  RAISE EXCEPTION 'Sale identity and ownership are immutable';
 END IF;
 NEW.lock_version:=OLD.lock_version+1;NEW.updated_at:=now();RETURN NEW;
END $$;
CREATE TRIGGER biosite_sale_guard BEFORE UPDATE ON public.biosite_sales FOR EACH ROW EXECUTE FUNCTION public.biosite_sale_guard();
ALTER TABLE public.biosite_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY sales_read ON public.biosite_sales FOR SELECT TO biosites_app_runtime
 USING(public.biosite_actor() IS NOT NULL AND (owner_id=public.biosite_actor() OR public.biosite_is_principal()));
CREATE POLICY sales_insert ON public.biosite_sales FOR INSERT TO biosites_app_runtime
 WITH CHECK(public.biosite_actor() IS NOT NULL AND public.biosite_owns(biosite_id) AND (owner_id=public.biosite_actor() OR public.biosite_is_principal()));
CREATE POLICY sales_update ON public.biosite_sales FOR UPDATE TO biosites_app_runtime
 USING(public.biosite_actor() IS NOT NULL AND (owner_id=public.biosite_actor() OR public.biosite_is_principal()))
 WITH CHECK(public.biosite_owns(biosite_id) AND (owner_id=public.biosite_actor() OR public.biosite_is_principal()));
REVOKE ALL ON public.biosite_sales FROM PUBLIC;
REVOKE ALL ON FUNCTION public.biosite_sale_guard() FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON public.biosite_sales TO biosites_app_runtime;
-- Deliberately no DELETE privilege or public/anonymous sales policy.
COMMIT;
