-- BioSite/Vitrine Digital V1. Prepared only; apply manually after approval.
-- No seed data, login, storage uploads or localStorage import.
BEGIN;

CREATE TABLE public.biosite_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true CHECK (singleton),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT biosite_admin_singleton UNIQUE (singleton)
);

CREATE TABLE public.biosites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.biosite_admin(id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE CHECK (
    length(slug) BETWEEN 1 AND 100 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  status text NOT NULL DEFAULT 'unpublished' CHECK (status IN ('published', 'unpublished')),
  draft_revision bigint NOT NULL,
  published_revision bigint,
  lock_version bigint NOT NULL DEFAULT 1 CHECK (lock_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  unpublished_at timestamptz,
  CHECK (status <> 'published' OR (published_revision IS NOT NULL AND published_at IS NOT NULL)),
  CHECK ((published_revision IS NULL) = (published_at IS NULL))
);

CREATE TABLE public.biosite_revisions (
  biosite_id uuid NOT NULL REFERENCES public.biosites(id) ON DELETE RESTRICT,
  version bigint NOT NULL CHECK (version > 0),
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  category text NOT NULL CHECK (length(btrim(category)) BETWEEN 1 AND 100),
  template_id text NOT NULL CHECK (length(btrim(template_id)) BETWEEN 1 AND 100),
  content jsonb NOT NULL CHECK (
    jsonb_typeof(content) = 'object'
    AND content ?& ARRAY['id', 'name', 'category', 'style', 'sections', 'actions', 'products', 'services', 'photos', 'highlights', 'benefits']
    AND jsonb_typeof(content->'id') = 'string'
    AND jsonb_typeof(content->'name') = 'string'
    AND jsonb_typeof(content->'category') = 'string'
    AND jsonb_typeof(content->'style') = 'string'
    AND content->>'category' = category
    AND jsonb_typeof(content->'sections') = 'array'
    AND jsonb_typeof(content->'actions') = 'array'
    AND jsonb_typeof(content->'products') = 'array'
    AND jsonb_typeof(content->'services') = 'array'
    AND jsonb_typeof(content->'photos') = 'array'
    AND jsonb_typeof(content->'highlights') = 'array'
    AND jsonb_typeof(content->'benefits') = 'array'
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (biosite_id, version)
);

-- Composite keys prevent pointing a BioSite at another BioSite's content.
-- Deferred checks allow inserting a site and its first revision atomically.
ALTER TABLE public.biosites
  ADD CONSTRAINT biosites_draft_fk FOREIGN KEY (id, draft_revision)
    REFERENCES public.biosite_revisions(biosite_id, version) DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT biosites_published_fk FOREIGN KEY (id, published_revision)
    REFERENCES public.biosite_revisions(biosite_id, version) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE public.biosite_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  biosite_id uuid NOT NULL REFERENCES public.biosites(id) ON DELETE RESTRICT,
  storage_provider text NOT NULL CHECK (length(btrim(storage_provider)) BETWEEN 1 AND 100),
  storage_key text NOT NULL CHECK (length(btrim(storage_key)) BETWEEN 1 AND 1024),
  original_name text,
  mime_type text NOT NULL CHECK (length(btrim(mime_type)) BETWEEN 1 AND 255),
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (biosite_id, id),
  UNIQUE (storage_provider, storage_key)
);

CREATE INDEX biosites_admin_updated_idx ON public.biosites (admin_id, updated_at DESC);
CREATE INDEX biosite_assets_site_created_idx ON public.biosite_assets (biosite_id, created_at DESC);

CREATE FUNCTION public.biosite_guard_site() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BioSites cannot be deleted; unpublish to retain permanent slugs';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.admin_id IS DISTINCT FROM OLD.admin_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'BioSite identity, owner and slug are immutable';
  END IF;
  NEW.lock_version := OLD.lock_version + 1;
  NEW.updated_at := clock_timestamp();
  IF NEW.published_revision IS DISTINCT FROM OLD.published_revision
     OR (NEW.status = 'published' AND OLD.status <> 'published') THEN
    NEW.published_at := CASE WHEN NEW.published_revision IS NULL THEN NULL ELSE clock_timestamp() END;
  END IF;
  IF NEW.status = 'unpublished' AND OLD.status = 'published' THEN
    NEW.unpublished_at := clock_timestamp();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER biosites_guard BEFORE UPDATE OR DELETE ON public.biosites
  FOR EACH ROW EXECUTE FUNCTION public.biosite_guard_site();

CREATE FUNCTION public.biosite_guard_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  RAISE EXCEPTION 'BioSite revisions are immutable; insert a new version';
END;
$$;
CREATE TRIGGER biosite_revisions_guard BEFORE UPDATE OR DELETE ON public.biosite_revisions
  FOR EACH ROW EXECUTE FUNCTION public.biosite_guard_revision();

-- Fail closed for non-owner roles. No browser/anonymous access or policies.
-- The owner can bypass RLS: its credentials must remain exclusively server-side.
ALTER TABLE public.biosite_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biosites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biosite_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biosite_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.biosite_admin, public.biosites, public.biosite_revisions, public.biosite_assets FROM PUBLIC;
REVOKE ALL ON FUNCTION public.biosite_guard_site(), public.biosite_guard_revision() FROM PUBLIC;

COMMIT;
