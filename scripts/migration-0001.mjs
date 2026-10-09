// One-off operator tool. Never imports frontend code or logs connection secrets.
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { parseEnv } from 'node:util'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { neon } from '@neondatabase/serverless'

const root = new URL('../', import.meta.url)
const names = ['biosite_admin', 'biosite_assets', 'biosite_revisions', 'biosites']
const hash = text => createHash('sha256').update(text).digest('hex')
let stage = 'configuration'
const catalog = {
  identity: `SELECT current_database() AS database, current_user AS role`,
  tables: `SELECT n.nspname AS schema, c.relname AS name, c.relrowsecurity AS rls, c.relforcerowsecurity AS force_rls
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname !~ '^pg_toast' ORDER BY 1,2`,
  columns: `SELECT table_name, column_name, udt_name AS type, is_nullable AS nullable, column_default AS default
    FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('biosite_admin','biosite_assets','biosite_revisions','biosites') ORDER BY table_name,ordinal_position`,
  constraints: `SELECT c.relname AS table_name, x.conname AS name, x.contype AS type, x.convalidated AS validated,
    x.condeferrable AS deferrable, x.condeferred AS deferred, pg_get_constraintdef(x.oid) AS definition
    FROM pg_constraint x JOIN pg_class c ON c.oid=x.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND x.contype <> 'n' AND c.relname IN ('biosite_admin','biosite_assets','biosite_revisions','biosites') ORDER BY 1,2`,
  indexes: `SELECT c.relname AS table_name, i.relname AS name, x.indisvalid AS valid, x.indisready AS ready,
    x.indisunique AS unique, pg_get_indexdef(i.oid) AS definition
    FROM pg_index x JOIN pg_class c ON c.oid=x.indrelid JOIN pg_class i ON i.oid=x.indexrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
    AND c.relname IN ('biosite_admin','biosite_assets','biosite_revisions','biosites') ORDER BY 1,2`,
  triggers: `SELECT c.relname AS table_name,t.tgname AS name,t.tgenabled AS enabled,pg_get_triggerdef(t.oid) AS definition
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY 1,2`,
  functions: `SELECT p.proname AS name,p.prosecdef AS security_definer,p.proconfig AS config,p.prosrc AS body
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
    AND p.proname IN ('biosite_guard_site','biosite_guard_revision') ORDER BY 1`,
  policies: `SELECT tablename,policyname FROM pg_policies WHERE schemaname='public'
    AND tablename IN ('biosite_admin','biosite_assets','biosite_revisions','biosites')`,
  public_grants: `SELECT c.relname AS name,a.privilege_type FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
    WHERE n.nspname='public' AND c.relname IN ('biosite_admin','biosite_assets','biosite_revisions','biosites') AND a.grantee=0
    UNION ALL SELECT p.proname,a.privilege_type FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
    WHERE n.nspname='public' AND p.proname IN ('biosite_guard_site','biosite_guard_revision') AND a.grantee=0`,
  row_counts: `SELECT 'biosite_admin' AS name,count(*)::int AS total FROM public.biosite_admin
    UNION ALL SELECT 'biosites',count(*)::int FROM public.biosites
    UNION ALL SELECT 'biosite_revisions',count(*)::int FROM public.biosite_revisions
    UNION ALL SELECT 'biosite_assets',count(*)::int FROM public.biosite_assets ORDER BY 1`,
}

// Split this exact migration while preserving quoted literals and $$ function bodies.
function statements(source) {
  const result = []
  let start=0, single=false, dollar=false, comment=false
  for(let i=0;i<source.length;i++) {
    if(comment) { if(source[i]==='\n') comment=false; continue }
    if(!single && source.slice(i,i+2)==='$$') { dollar=!dollar;i++;continue }
    if(dollar) continue
    if(!single && source.slice(i,i+2)==='--') { comment=true;i++;continue }
    if(source[i]==="'") { if(single && source[i+1]==="'") {i++;continue} single=!single;continue }
    if(!single && source[i]===';') {result.push(source.slice(start,i).trim());start=i+1}
  }
  assert(!single && !dollar)
  assert.equal(source.slice(start).trim(),'')
  assert.match(result.shift(), /BEGIN$/)
  assert.equal(result.pop(),'COMMIT')
  return result
}

async function frontendHashes() {
  const files={}
  async function walk(dir) {
    for(const item of await readdir(new URL(dir,root),{withFileTypes:true})) {
      const path=dir+item.name
      if(item.isDirectory()) await walk(path+'/')
      else files[path]=hash(await readFile(new URL(path,root)))
    }
  }
  await walk('src/'); await walk('tests/');
  files['package.json']=hash(await readFile(new URL('package.json',root)))
  return files
}

function validate(data, migration) {
  assert.deepEqual(data.identity,[{database:'neondb',role:'neondb_owner'}])
  assert.deepEqual(data.tables.map(t=>[t.schema,t.name]),names.map(n=>['public',n]))
  assert(data.tables.every(t=>t.rls===true && t.force_rls===false))
  const expectedColumns={
    biosite_admin: 'id:uuid singleton:bool created_at:timestamptz',
    biosites: 'id:uuid admin_id:uuid slug:text status:text draft_revision:int8 published_revision:int8? lock_version:int8 created_at:timestamptz updated_at:timestamptz published_at:timestamptz? unpublished_at:timestamptz?',
    biosite_revisions: 'biosite_id:uuid version:int8 schema_version:int4 category:text template_id:text content:jsonb created_at:timestamptz',
    biosite_assets: 'id:uuid biosite_id:uuid storage_provider:text storage_key:text original_name:text? mime_type:text byte_size:int8 metadata:jsonb created_at:timestamptz',
  }
  for(const name of names) assert.equal(data.columns.filter(c=>c.table_name===name).map(c=>`${c.column_name}:${c.type}${c.nullable==='YES'?'?':''}`).join(' '),expectedColumns[name])
  const defaults = {id:'gen_random_uuid()',singleton:'true',status:"'unpublished'::text",lock_version:'1',schema_version:'1',created_at:'now()',updated_at:'now()',metadata:"'{}'::jsonb"}
  for(const c of data.columns) assert.equal(c.default,defaults[c.column_name]??null)
  assert.equal(data.constraints.length,29)
  assert(data.constraints.every(c=>c.validated))
  for(const [table,count] of Object.entries({biosite_admin:3,biosites:10,biosite_revisions:7,biosite_assets:9})) assert.equal(data.constraints.filter(c=>c.table_name===table).length,count)
  const exact = {
    biosite_admin_pkey:'PRIMARY KEY (id)',biosite_admin_singleton:'UNIQUE (singleton)',biosite_admin_singleton_check:'CHECK (singleton)',
    biosites_pkey:'PRIMARY KEY (id)',biosites_slug_key:'UNIQUE (slug)',
    biosites_admin_id_fkey:'FOREIGN KEY (admin_id) REFERENCES biosite_admin(id) ON DELETE RESTRICT',
    biosites_draft_fk:'FOREIGN KEY (id, draft_revision) REFERENCES biosite_revisions(biosite_id, version) DEFERRABLE INITIALLY DEFERRED',
    biosites_published_fk:'FOREIGN KEY (id, published_revision) REFERENCES biosite_revisions(biosite_id, version) DEFERRABLE INITIALLY DEFERRED',
    biosite_revisions_pkey:'PRIMARY KEY (biosite_id, version)',biosite_revisions_biosite_id_fkey:'FOREIGN KEY (biosite_id) REFERENCES biosites(id) ON DELETE RESTRICT',
    biosite_assets_pkey:'PRIMARY KEY (id)',biosite_assets_biosite_id_fkey:'FOREIGN KEY (biosite_id) REFERENCES biosites(id) ON DELETE RESTRICT',
    biosite_assets_biosite_id_id_key:'UNIQUE (biosite_id, id)',biosite_assets_storage_provider_storage_key_key:'UNIQUE (storage_provider, storage_key)',
  }
  for(const [name,definition] of Object.entries(exact)) assert.equal(data.constraints.find(c=>c.name===name)?.definition,definition)
  for(const c of data.constraints) assert.equal(c.deferrable,c.name==='biosites_draft_fk'||c.name==='biosites_published_fk')
  for(const c of data.constraints) assert.equal(c.deferred,c.deferrable)
  assert.equal(data.constraints.filter(c=>c.type==='c').length,16)
  const checkDefinitions = {
    biosite_assets_byte_size_check:'CHECK ((byte_size >= 0))',
    biosite_assets_metadata_check:"CHECK ((jsonb_typeof(metadata) = 'object'::text))",
    biosite_revisions_schema_version_check:'CHECK ((schema_version > 0))',
    biosite_revisions_version_check:'CHECK ((version > 0))',
    biosites_lock_version_check:'CHECK ((lock_version > 0))',
    biosites_check:"CHECK (((status <> 'published'::text) OR ((published_revision IS NOT NULL) AND (published_at IS NOT NULL))))",
    biosites_check1:'CHECK (((published_revision IS NULL) = (published_at IS NULL)))',
    biosites_slug_check:"CHECK ((((length(slug) >= 1) AND (length(slug) <= 100)) AND (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)))",
    biosites_status_check:"CHECK ((status = ANY (ARRAY['published'::text, 'unpublished'::text])))",
  }
  for(const [table,column,max] of [
    ['biosite_assets','mime_type',255],['biosite_assets','storage_key',1024],['biosite_assets','storage_provider',100],
    ['biosite_revisions','category',100],['biosite_revisions','template_id',100],
  ]) checkDefinitions[`${table}_${column}_check`]=`CHECK (((length(btrim(${column})) >= 1) AND (length(btrim(${column})) <= ${max})))`
  for(const [name,definition] of Object.entries(checkDefinitions)) assert.equal(data.constraints.find(c=>c.name===name)?.definition,definition)
  const jsonCheck=data.constraints.find(c=>c.name==='biosite_revisions_check')?.definition
  assert(jsonCheck)
  for(const [key,type] of Object.entries({id:'string',name:'string',category:'string',style:'string',sections:'array',actions:'array',products:'array',services:'array',photos:'array',highlights:'array',benefits:'array'})) {
    assert(jsonCheck.includes(`'${key}'::text`))
    assert(jsonCheck.includes(`jsonb_typeof((content -> '${key}'::text)) = '${type}'::text`))
  }
  assert(jsonCheck.includes("jsonb_typeof(content) = 'object'::text"))
  assert(jsonCheck.includes('content ?& ARRAY['))
  assert(jsonCheck.includes("(content ->> 'category'::text) = category"))
  assert.equal(data.indexes.length,10)
  assert(data.indexes.every(i=>i.valid&&i.ready))
  assert.equal(data.indexes.filter(i=>i.unique).length,8)
  for(const [name,columns] of Object.entries({biosites_admin_updated_idx:'(admin_id, updated_at DESC)',biosite_assets_site_created_idx:'(biosite_id, created_at DESC)'})) assert(data.indexes.find(i=>i.name===name)?.definition.endsWith(columns))
  for(const c of data.constraints.filter(c=>['p','u'].includes(c.type))) {
    const index=data.indexes.find(i=>i.name===c.name)
    assert(index?.unique)
    assert(index.definition.endsWith(c.definition.slice(c.definition.indexOf('('))))
  }
  assert.deepEqual(data.triggers.map(t=>[t.table_name,t.name,t.enabled]),[['biosite_revisions','biosite_revisions_guard','O'],['biosites','biosites_guard','O']])
  assert(data.triggers.every(t=>t.definition.includes('BEFORE DELETE OR UPDATE')&&t.definition.includes('FOR EACH ROW EXECUTE FUNCTION')))
  assert.equal(data.functions.length,2)
  for(const f of data.functions) {
    assert.equal(f.security_definer,false)
    assert.deepEqual(f.config,['search_path=pg_catalog'])
    const body=migration.split(`CREATE FUNCTION public.${f.name}()`)[1].split('$$')[1]
    assert.equal(f.body.trim(),body.trim())
  }
  assert.equal(data.policies.length,0);assert.equal(data.public_grants.length,0)
  assert(data.row_counts.every(r=>r.total===0))
}

// All fixtures are rolled back by the outer PL/pgSQL exception subtransaction.
const behavior = `DO $test$
DECLARE a uuid := gen_random_uuid(); s uuid := gen_random_uuid(); other uuid := gen_random_uuid();
  payload jsonb := '{"id":"fixture","name":"Fixture","category":"Fixture","style":"boutique-gold","sections":[],"actions":[],"products":[],"services":[],"photos":[],"highlights":[],"benefits":[]}'::jsonb;
BEGIN
  BEGIN
    INSERT INTO public.biosite_admin(id) VALUES(a);
    BEGIN INSERT INTO public.biosite_admin DEFAULT VALUES; RAISE EXCEPTION 'single admin accepted duplicate'; EXCEPTION WHEN unique_violation THEN NULL; END;
    INSERT INTO public.biosites(id,admin_id,slug,draft_revision) VALUES(s,a,'migration-fixture',1),(other,a,'migration-other',1);
    INSERT INTO public.biosite_revisions(biosite_id,version,category,template_id,content) VALUES(s,1,'Fixture','fixture',payload),(other,1,'Fixture','fixture',payload);
    SET CONSTRAINTS ALL IMMEDIATE;
    BEGIN UPDATE public.biosites SET draft_revision=999 WHERE id=s; RAISE EXCEPTION 'missing revision accepted'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
    BEGIN INSERT INTO public.biosites(admin_id,slug,draft_revision) VALUES(a,'migration-fixture',1); RAISE EXCEPTION 'duplicate slug accepted'; EXCEPTION WHEN unique_violation THEN NULL; END;
    BEGIN INSERT INTO public.biosites(admin_id,slug,draft_revision) VALUES(a,'Uppercase',1); RAISE EXCEPTION 'invalid slug accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
    BEGIN UPDATE public.biosites SET slug='changed' WHERE id=s; RAISE EXCEPTION USING ERRCODE='Z0002'; EXCEPTION WHEN raise_exception THEN NULL; END;
    BEGIN DELETE FROM public.biosites WHERE id=s; RAISE EXCEPTION USING ERRCODE='Z0002'; EXCEPTION WHEN raise_exception THEN NULL; END;
    BEGIN UPDATE public.biosite_revisions SET content=payload WHERE biosite_id=s; RAISE EXCEPTION USING ERRCODE='Z0002'; EXCEPTION WHEN raise_exception THEN NULL; END;
    BEGIN DELETE FROM public.biosite_revisions WHERE biosite_id=s; RAISE EXCEPTION USING ERRCODE='Z0002'; EXCEPTION WHEN raise_exception THEN NULL; END;
    BEGIN INSERT INTO public.biosite_revisions(biosite_id,version,category,template_id,content) VALUES(s,2,'Fixture','fixture','{}'); RAISE EXCEPTION 'invalid JSON accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
    INSERT INTO public.biosite_revisions(biosite_id,version,category,template_id,content) VALUES(s,2,'Fixture','fixture',payload || '{"name":"Edited"}'),(other,3,'Fixture','fixture',payload);
    BEGIN UPDATE public.biosites SET draft_revision=3 WHERE id=s; RAISE EXCEPTION 'cross-site draft accepted'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
    BEGIN UPDATE public.biosites SET published_revision=3,status='published' WHERE id=s; RAISE EXCEPTION 'cross-site publication accepted'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
    UPDATE public.biosites SET published_revision=1,status='published' WHERE id=s;
    UPDATE public.biosites SET draft_revision=2 WHERE id=s;
    IF NOT EXISTS(SELECT 1 FROM public.biosites WHERE id=s AND draft_revision=2 AND published_revision=1 AND status='published' AND published_at IS NOT NULL AND lock_version=3) THEN RAISE EXCEPTION 'draft/publication/version separation failed'; END IF;
    UPDATE public.biosites SET status='unpublished' WHERE id=s;
    IF NOT EXISTS(SELECT 1 FROM public.biosites WHERE id=s AND published_revision=1 AND unpublished_at IS NOT NULL AND slug='migration-fixture') THEN RAISE EXCEPTION 'unpublish failed'; END IF;
    INSERT INTO public.biosite_assets(biosite_id,storage_provider,storage_key,mime_type,byte_size) VALUES(s,'fixture','fixture-key','image/png',1);
    BEGIN INSERT INTO public.biosite_assets(biosite_id,storage_provider,storage_key,mime_type,byte_size) VALUES(other,'fixture','fixture-key','image/png',1); RAISE EXCEPTION 'shared storage key accepted'; EXCEPTION WHEN unique_violation THEN NULL; END;
    RAISE EXCEPTION USING ERRCODE='Z0001',MESSAGE='rollback verification fixtures';
  EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
  END;
END;
$test$`

async function main() {
  const mode=process.argv[2]
  assert(['apply','verify'].includes(mode))
  const config=parseEnv(await readFile(new URL('.env.server.local',root),'utf8'))
  assert.equal(config.NEON_PROJECT_ID,'muddy-star-65783442')
  assert.equal(config.NEON_BRANCH_ID,'br-raspy-pine-b4i56qaa')
  assert.equal(config.NEON_DATABASE_NAME,'neondb')
  const connection=new URL(config.DATABASE_URL)
  const expectedHost='ep-cool-flower-b4g5hcwp-pooler.c-6.us-east-2.aws.neon.tech'
  assert.equal(config.NEON_DATABASE_HOST,expectedHost);assert.equal(connection.hostname,expectedHost)
  assert.equal(decodeURIComponent(connection.username),'neondb_owner')
  assert.equal(connection.pathname,'/neondb');assert.equal(connection.searchParams.get('sslmode'),'require')
  assert(['postgres:','postgresql:'].includes(connection.protocol))
  const migration=await readFile(new URL('migrations/0001_biosite.sql',root),'utf8')
  const baseline=await frontendHashes()
  const sql=neon(config.DATABASE_URL,{fetchOptions:{signal:AbortSignal.timeout(45000)}})
  const readCatalog=async keys=>Object.fromEntries((await sql.transaction(keys.map(k=>sql.query(catalog[k])),{readOnly:true})).map((v,i)=>[keys[i],v]))
  if(mode==='apply') {
    stage='preflight'
    const before=await readCatalog(['identity','tables'])
    assert.deepEqual(before.identity,[{database:'neondb',role:'neondb_owner'}])
    assert.equal(before.tables.length,0)
    stage='apply-transaction'
    await sql.transaction(statements(migration).map(s=>sql.query(s)))
    console.log('0001 committed atomically. No other migration submitted.')
  }
  stage='catalog-verification'
  let data=await readCatalog(Object.keys(catalog));validate(data,migration)
  stage='behavior-verification-with-rollback'
  await sql.query(behavior)
  stage='post-verification'
  data=await readCatalog(Object.keys(catalog));validate(data,migration)
  assert.deepEqual(await frontendHashes(),baseline)
  await writeFile(new URL('migrations/0001-verification.json',root),JSON.stringify({
    verified_at:new Date().toISOString(),project_id:config.NEON_PROJECT_ID,branch_id:config.NEON_BRANCH_ID,
    identity_evidence:'Local IDs matched; connection matched the user-confirmed pooled endpoint; SQL database and role matched. No Neon management API used.',
    migration_sha256:hash(migration),frontend_unchanged:true,frontend_sha256:baseline,
    behavioral_checks:'Singleton, slug uniqueness/format/immutability, deletion guards, JSON shape, revision immutability, cross-site FKs, separate draft/publication, version increment, unpublish retention, storage isolation. All fixtures rolled back.',
    catalog:data,
  },null,2)+'\n')
  console.log('Verified: 4 tables only, 29 constraints, 10 indexes, 2 guards, RLS on, zero policies/PUBLIC grants, zero stored rows. Frontend unchanged. Report saved without credentials.')
}
main().catch(error=>{
  // Never print error messages/stacks: connection errors can contain secrets.
  const code=/^[A-Z0-9_]{1,20}$/.test(String(error?.code??''))?error.code:'omitted'
  console.error(`Stopped at ${stage}; error code: ${code}. Private details omitted. Do not reapply blindly.`)
  if(stage==='catalog-verification' && code==='ERR_ASSERTION') {
    console.error(String(error.stack).split('\n').find(line=>line.includes('at validate '))??'Catalog assertion failed')
    console.error(JSON.stringify({actual:error.actual,expected:error.expected}))
  }
  process.exitCode=1
})
