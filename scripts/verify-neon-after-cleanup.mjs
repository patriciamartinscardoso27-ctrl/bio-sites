// Independent connection; SELECT only. Never executes the cleanup SQL.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {neon} from '@neondatabase/serverless'
import {serverConfig} from '../server/config.mjs'
import {connectRepository} from '../server/repository.mjs'
await connectRepository();const config=await serverConfig(),sql=neon(config.DATABASE_URL)
const i=JSON.parse(await fs.readFile('artifacts/neon-cleanup/inventory.json','utf8')),receipt=JSON.parse(await fs.readFile('artifacts/neon-cleanup/execution-result.json','utf8'))
const before=JSON.parse(await fs.readFile(i.files.fingerprints.path,'utf8')),ids=receipt.deletedIds
assert(receipt.committed);assert.equal(ids.length,7)
const [mode,sites,revisions,guards,columns,admin,assets]=await sql.transaction([
 sql`SELECT current_setting('transaction_read_only') AS mode`,
 sql`SELECT id,md5(row_to_json(b)::text) AS hash FROM public.biosites b ORDER BY id`,
 sql`SELECT biosite_id,version::text AS version,md5(row_to_json(r)::text) AS hash FROM public.biosite_revisions r ORDER BY biosite_id,version`,
 sql`SELECT c.relname AS table_name,t.tgname AS trigger_name,t.tgenabled AS enabled,pg_get_triggerdef(t.oid) AS definition,pg_get_functiondef(t.tgfoid) AS function_definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname LIKE 'biosite%' AND NOT t.tgisinternal ORDER BY c.relname,t.tgname`,
 sql`SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name LIKE 'biosite%' ORDER BY table_name,ordinal_position`,
 sql`SELECT count(*)::int AS count FROM public.biosite_admin`,
 sql`SELECT count(*)::int AS count FROM public.biosite_assets`,
],{readOnly:true,fetchOptions:{signal:AbortSignal.timeout(30000)}})
assert.equal(mode[0].mode,'on');assert.equal(sites.length,7);assert.equal(revisions.length,217)
assert.deepEqual(sites,before[0].filter(x=>!ids.includes(x.id)));assert.deepEqual(revisions,before[1].filter(x=>!ids.includes(x.biosite_id)))
const oldGuards=JSON.parse(await fs.readFile(i.files.triggers.path,'utf8'));assert.equal(guards.length,2)
for(const g of guards){assert.equal(g.enabled,'O');const old=oldGuards.find(x=>x.trigger_name===g.trigger_name&&x.table_name===g.table_name);assert(old);assert.equal(g.definition,old.definition);assert.equal(g.function_definition,old.function_definition)}
assert.deepEqual(columns,JSON.parse(await fs.readFile(i.files.columns.path,'utf8')));assert.equal(admin[0].count,1);assert.equal(assets[0].count,0)
const verification={verifiedAt:new Date().toISOString(),readOnly:true,newConnection:true,sites:7,revisions:217,allPreservedRowHashesMatch:true,deletedIdsAbsent:true,guards:guards.map(x=>({name:x.trigger_name,active:x.enabled==='O'})),guardDefinitionsUnchanged:true,columnsUnchanged:true,adminAccounts:1,assetRows:0,deployExecuted:false}
await fs.writeFile('artifacts/neon-cleanup/post-cleanup-verification.json',JSON.stringify(verification,null,2));console.log(JSON.stringify(verification,null,2))
