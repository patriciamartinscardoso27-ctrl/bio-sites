-- Isolated validation / approved rollback only. Refuses to discard any sale.
BEGIN;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM public.biosite_sales) THEN
 RAISE EXCEPTION 'Sales exist: preserve/export them before a separately approved rollback';
END IF; END $$;
DROP TABLE public.biosite_sales;
DROP FUNCTION public.biosite_sale_guard();
DROP INDEX public.biosite_ownership_site_user;
COMMIT;
