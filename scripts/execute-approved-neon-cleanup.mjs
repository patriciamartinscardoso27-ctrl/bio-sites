// One-time execution authorized by the user: only the exact validated SQL hash.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Client,neonConfig} from '@neondatabase/serverless'
import {connectRepository} from '../server/repository.mjs'
import {serverConfig} from '../server/config.mjs'
assert(process.argv.includes('--execute-approved-cleanup'),'Explicit execution flag required')
try{await fs.access('artifacts/neon-cleanup/execution-result.json');throw Error('Cleanup already executed; refuse another execution')}catch(error){if(error.code!=='ENOENT')throw error}
const expectedHash='63a43aba5988a5a7ba2c7a38f91e1be852d74b3399892e40387eab8d4c7ff6e5'
const sql=await fs.readFile('artifacts/neon-cleanup/proposed-cleanup.sql','utf8')
const hash=x=>createHash('sha256').update(x).digest('hex')
assert.equal(hash(sql),expectedHash,'Approved SQL changed; execution refused')
const inventory=JSON.parse(await fs.readFile('artifacts/neon-cleanup/inventory.json','utf8'))
const validation=JSON.parse(await fs.readFile('artifacts/neon-cleanup/isolated-validation.json','utf8'))
const targets=['046190c7-5a53-4354-9115-3b64fc5e042e','fd6f8f5c-9832-4000-ab1a-21b9d36da31a','132586fb-f686-4be4-a2f5-1e9e0c431dbc','c9db15c9-da64-480b-acc7-b852ebe381a1','e692c475-c5b0-4932-a49e-4d43279f250b','e9277bb5-dbf3-4e5c-a4d9-fc6e2a369e0f','7d1f4b59-6307-4132-981a-ca6a0dfafcc0']
assert.deepEqual([...validation.targetIds].sort(),[...targets].sort())
assert(validation.exactPlanSuccessful&&validation.guardsRestoredOnEveryRollback&&validation.guardsEnabledAfterCommitAndReopen)
for(const file of Object.values(inventory.files))assert.equal(hash(await fs.readFile(file.path)),file.sha256,'Backup integrity failed')
const precision=JSON.parse(await fs.readFile('artifacts/neon-cleanup/timestamp-precision-manifest.json','utf8'))
assert.equal(hash(await fs.readFile(precision.path)),precision.sha256,'Timestamp backup integrity failed')
const baseline=JSON.parse(await fs.readFile(inventory.files.fingerprints.path,'utf8'))
await connectRepository() // Existing host/project/database/admin scope guard; read only.
const config=await serverConfig()
assert.equal(config.NEON_PROJECT_ID,'muddy-star-65783442');assert.equal(config.NEON_BRANCH_ID,'br-raspy-pine-b4i56qaa')
neonConfig.webSocketConstructor=WebSocket
const client=new Client({connectionString:config.DATABASE_URL,connectionTimeoutMillis:20000})
const query=async(text,args)=>(await client.query(text,args)).rows
const fingerprints=async()=>[await query('SELECT id,md5(row_to_json(b)::text) AS hash FROM public.biosites b ORDER BY id'),await query('SELECT biosite_id,version::text AS version,md5(row_to_json(r)::text) AS hash FROM public.biosite_revisions r ORDER BY biosite_id,version')]
const guards=async()=>await query("SELECT c.relname AS table_name,t.tgname AS trigger_name,t.tgenabled AS enabled,pg_get_triggerdef(t.oid) AS definition,pg_get_functiondef(t.tgfoid) AS function_definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('biosites','biosite_revisions') AND NOT t.tgisinternal ORDER BY c.relname,t.tgname")
let phase='connect',submitted=false,commitConfirmed=false
try{
 await client.connect();await client.query('BEGIN READ ONLY')
 phase='preflight'
 assert.equal((await query('SELECT current_database() AS database'))[0].database,'neondb')
 assert.deepEqual(await fingerprints(),baseline,'Production differs from restored backup')
 const beforeGuards=await guards(),savedGuards=JSON.parse(await fs.readFile(inventory.files.triggers.path,'utf8'))
 assert.equal(beforeGuards.length,2)
 for(const guard of beforeGuards){assert.equal(guard.enabled,'O');const old=savedGuards.find(x=>x.table_name===guard.table_name&&x.trigger_name===guard.trigger_name);assert(old);assert.equal(guard.definition,old.definition);assert.equal(guard.function_definition,old.function_definition)}
 const sites=await query('SELECT b.id,b.status,b.published_revision,r.content->>\'name\' AS name,(SELECT count(*)::int FROM public.biosite_revisions rr WHERE rr.biosite_id=b.id) AS revisions FROM public.biosites b JOIN public.biosite_revisions r ON r.biosite_id=b.id AND r.version=b.draft_revision WHERE b.id=ANY($1::uuid[]) ORDER BY b.id',[targets])
 assert.equal(sites.length,7);assert.equal(sites.reduce((n,x)=>n+x.revisions,0),52)
 for(const site of sites){assert.equal(site.status,'unpublished');assert.equal(site.published_revision,null);const old=inventory.inventory.find(x=>x.id===site.id);assert.equal(site.name,old.name);assert.equal(site.revisions,old.revisions)}
 const adminBefore=await query('SELECT id,md5(row_to_json(a)::text) AS hash FROM public.biosite_admin a ORDER BY id')
 const assetsBefore=await query('SELECT id,md5(row_to_json(a)::text) AS hash FROM public.biosite_assets a ORDER BY id')
 assert.equal(adminBefore.length,1);assert.equal(assetsBefore.length,0)
 await client.query('COMMIT')
 await fs.writeFile('artifacts/neon-cleanup/execution-preflight.json',JSON.stringify({checkedAt:new Date().toISOString(),readOnly:true,sqlSHA256:expectedHash,backupVerified:true,sitesBefore:14,revisionsBefore:269,targets:sites,guardsEnabled:true},null,2))
 console.log('Preflight confirmado: 7 IDs exatos, 52 revisões; origem 14/269 idêntica ao backup; guards ativos.')
 phase='approved-transaction';submitted=true
 // Simple query sends the unmodified BEGIN ... COMMIT file as one session operation.
 const commands=await client.query(sql)
 commitConfirmed=true
 const deletes=commands.filter(x=>x.command==='DELETE').map(x=>x.rowCount)
 assert.deepEqual(deletes,[52,7])
 phase='postflight';await client.query('BEGIN READ ONLY')
 const after=await fingerprints(),expected=[baseline[0].filter(x=>!targets.includes(x.id)),baseline[1].filter(x=>!targets.includes(x.biosite_id))]
 assert.deepEqual(after,expected,'Preserved data mismatch');assert.equal(after[0].length,7);assert.equal(after[1].length,217)
 const afterGuards=await guards();assert.deepEqual(afterGuards,beforeGuards,'Trigger protection changed')
 assert.deepEqual(await query('SELECT id,md5(row_to_json(a)::text) AS hash FROM public.biosite_admin a ORDER BY id'),adminBefore)
 assert.deepEqual(await query('SELECT id,md5(row_to_json(a)::text) AS hash FROM public.biosite_assets a ORDER BY id'),assetsBefore)
 await client.query('COMMIT')
 const receipt={executedAt:new Date().toISOString(),projectId:config.NEON_PROJECT_ID,branchId:config.NEON_BRANCH_ID,sqlSHA256:expectedHash,committed:true,deletedSites:7,deletedRevisions:52,deletedIds:targets,remainingSites:7,remainingRevisions:217,preservedRowsHashIdentical:true,guardsEnabled:true,guardDefinitionsUnchanged:true,adminUnchanged:true,assetsUnchanged:true,backupAvailable:true,backupTimestampSupplementAvailable:true,otherDeletes:0,deployExecuted:false}
 await fs.writeFile('artifacts/neon-cleanup/execution-result.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2))
}catch(error){
 let rollbackConfirmed=false;try{await client.query('ROLLBACK');rollbackConfirmed=true}catch{}
 await fs.writeFile('artifacts/neon-cleanup/execution-error.json',JSON.stringify({at:new Date().toISOString(),phase,sqlSubmitted:submitted,commitConfirmed,rollbackConfirmed,errorCode:error.code||'VALIDATION_FAILED',requiresReadOnlyInspection:submitted&&!commitConfirmed},null,2))
 console.error(JSON.stringify({phase,sqlSubmitted:submitted,commitConfirmed,rollbackConfirmed,errorCode:error.code||'VALIDATION_FAILED'}));process.exitCode=1
}finally{await client.end()}
