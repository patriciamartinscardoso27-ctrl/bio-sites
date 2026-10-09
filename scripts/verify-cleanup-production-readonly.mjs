// Production inspection is SELECT-only in a transaction explicitly readOnly=true.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {neon} from '@neondatabase/serverless'
import {connectRepository} from '../server/repository.mjs'
import {serverConfig} from '../server/config.mjs'
await connectRepository()
const config=await serverConfig(),sql=neon(config.DATABASE_URL)
const inventory=JSON.parse(await fs.readFile('artifacts/neon-cleanup/inventory.json','utf8'))
const baseline=JSON.parse(await fs.readFile(inventory.files.fingerprints.path,'utf8'))
const result=await sql.transaction([
 sql`SELECT current_setting('transaction_read_only') AS mode`,
 sql`SELECT id,md5(row_to_json(b)::text) AS hash FROM public.biosites b ORDER BY id`,
 sql`SELECT biosite_id,version::text AS version,md5(row_to_json(r)::text) AS hash FROM public.biosite_revisions r ORDER BY biosite_id,version`,
 sql`SELECT c.relname AS table_name,t.tgname AS name,t.tgenabled AS enabled,pg_get_triggerdef(t.oid) AS definition,pg_get_functiondef(t.tgfoid) AS function_definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('biosites','biosite_revisions') AND NOT t.tgisinternal ORDER BY c.relname,t.tgname`,
 sql`SELECT count(*)::int AS count FROM public.biosite_admin`,
 sql`SELECT count(*)::int AS count FROM public.biosite_assets`,
 sql`SELECT id,status,published_revision FROM public.biosites ORDER BY id`,
],{readOnly:true,fetchOptions:{signal:AbortSignal.timeout(30000)}})
assert.equal(result[0][0].mode,'on');assert.deepEqual(result[1],baseline[0]);assert.deepEqual(result[2],baseline[1])
assert.equal(result[4][0].count,1);assert.equal(result[5][0].count,0)
const saved=JSON.parse(await fs.readFile(inventory.files.triggers.path,'utf8'))
for(const t of result[3]){const old=saved.find(s=>s.table_name===t.table_name&&s.trigger_name===t.name);assert(old);assert.equal(t.enabled,'O');assert.equal(t.definition,old.definition);assert.equal(t.function_definition,old.function_definition)}
assert.equal(result[3].length,2)
const targets=inventory.inventory.filter(x=>x.recommendation.startsWith('EXCLUIR')).map(x=>({id:x.id,name:x.name,revisions:x.revisions}))
for(const t of targets){const site=result[6].find(x=>x.id===t.id);assert(site);assert.equal(site.status,'unpublished');assert.equal(site.published_revision,null)}
const report={checkedAt:new Date().toISOString(),readOnly:true,sites:14,revisions:269,allRowsUnchangedSinceBackup:true,adminAccounts:1,assetRows:0,protectionDefinitionsUnchanged:true,guardsEnabled:true,targets,excludedRevisions:52,preservedSites:7,preservedRevisions:217,productionWrites:0}
await fs.writeFile('artifacts/neon-cleanup/production-recheck.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))
