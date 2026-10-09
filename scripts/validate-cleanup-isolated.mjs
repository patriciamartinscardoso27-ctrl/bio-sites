// LOCAL ONLY: no Neon library, environment, HTTP, authentication or production connection.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {PGlite} from '../artifacts/neon-cleanup/isolated-runtime/node_modules/@electric-sql/pglite/dist/index.js'
const inventory=JSON.parse(await fs.readFile('artifacts/neon-cleanup/inventory.json','utf8'))
const files=inventory.files, targets=inventory.inventory.filter(x=>x.recommendation.startsWith('EXCLUIR')).map(x=>x.id)
const precisionManifest=JSON.parse(await fs.readFile('artifacts/neon-cleanup/timestamp-precision-manifest.json','utf8'))
const precisionBytes=await fs.readFile(precisionManifest.path)
assert.equal(createHash('sha256').update(precisionBytes).digest('hex'),precisionManifest.sha256)
const precision=JSON.parse(precisionBytes)
assert.equal(targets.length,7)
for(const f of Object.values(files))assert.equal(createHash('sha256').update(await fs.readFile(f.path)).digest('hex'),f.sha256,'Backup integrity')
const schema=await fs.readFile('migrations/0001_biosite.sql','utf8')
const columns=JSON.parse(await fs.readFile(files.columns.path,'utf8'))
const groups={biosite_admin:['admin'],biosites:['biosites'],biosite_revisions:Object.keys(files).filter(x=>x.startsWith('revisions/')),biosite_assets:['assets']}
const canonical=value=>JSON.stringify(sort(value))
function sort(value){if(Array.isArray(value))return value.map(sort);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sort(value[k])]));return value}
function normalized(table,row){const output={...row};for(const col of columns.filter(x=>x.table_name===table)){if(output[col.column_name]===null)continue;if(col.data_type==='timestamp with time zone')output[col.column_name]=new Date(output[col.column_name]).toISOString();if(col.data_type==='bigint')output[col.column_name]=String(output[col.column_name])}return output}
const dir=process.argv[2]||'artifacts/neon-cleanup/isolated-postgres-'+Date.now()
assert.match(dir,/^artifacts\/neon-cleanup\/isolated-postgres-[0-9]+$/)
let db=new PGlite(dir)
await db.exec("SET TIME ZONE 'UTC'")
if(!process.argv[2])await db.exec(schema)
async function restore(){await db.exec('BEGIN');try{for(const [table,keys]of Object.entries(groups)){for(const key of keys){const data=JSON.parse(await fs.readFile(files[key].path,'utf8'));for(const row of Array.isArray(data)?data:[data]){const names=Object.keys(row);await db.query(`INSERT INTO public.${table} (${names.map(n=>'"'+n+'"').join(',')}) VALUES (${names.map((_,i)=>'$'+(i+1)).join(',')})`,names.map(k=>row[k]&&typeof row[k]==='object'?JSON.stringify(row[k]):row[k]))}}console.log('Restaurado: '+table)}await db.exec('COMMIT')}catch(error){await db.exec('ROLLBACK');throw error}}
if(!process.argv[2])await restore()
// Restore exact timestamp precision in this local copy only. Guards are restored before commit.
await db.exec('BEGIN;ALTER TABLE public.biosites DISABLE TRIGGER biosites_guard;ALTER TABLE public.biosite_revisions DISABLE TRIGGER biosite_revisions_guard;')
for(const row of precision.sites)await db.query('UPDATE public.biosites SET created_at=$2,updated_at=$3,published_at=$4,unpublished_at=$5 WHERE id=$1',[row.id,row.created_at,row.updated_at,row.published_at,row.unpublished_at])
for(const row of precision.revisions)await db.query('UPDATE public.biosite_revisions SET created_at=$3 WHERE biosite_id=$1 AND version=$2',[row.biosite_id,row.version,row.created_at])
for(const row of precision.admin)await db.query('UPDATE public.biosite_admin SET created_at=$2 WHERE id=$1',[row.id,row.created_at])
await db.exec('ALTER TABLE public.biosites ENABLE TRIGGER biosites_guard;ALTER TABLE public.biosite_revisions ENABLE TRIGGER biosite_revisions_guard;COMMIT;')
await db.close();db=new PGlite(dir);await db.exec("SET TIME ZONE 'UTC'")
async function verify(onlyPreserved=false){let sites=0,revisions=0;for(const [table,keys]of Object.entries(groups)){for(const key of keys){const data=JSON.parse(await fs.readFile(files[key].path,'utf8'));for(const row of Array.isArray(data)?data:[data]){const id=table==='biosite_revisions'?row.biosite_id:row.id;if(onlyPreserved&&targets.includes(id))continue;const condition=table==='biosite_revisions'?'biosite_id=$1 AND version=$2':'id=$1';const args=table==='biosite_revisions'?[row.biosite_id,row.version]:[row.id];const restored=(await db.query(`SELECT row_to_json(t) AS value FROM public.${table} t WHERE ${condition}`,args)).rows[0]?.value;assert(restored,`Missing ${table} ${id}`);assert.equal(canonical(normalized(table,restored)),canonical(normalized(table,row)),`Restore content mismatch ${table} ${id}`);if(table==='biosites')sites++;if(table==='biosite_revisions')revisions++}}}return{sites,revisions}}
const restored=await verify();assert.deepEqual(restored,{sites:14,revisions:269});console.log('Backup reaberto e conteúdo integral conferido: 14/269')
const triggerState=async()=> (await db.query("SELECT tgname,tgenabled FROM pg_trigger WHERE NOT tgisinternal ORDER BY tgname")).rows
const initialTriggers=await triggerState();assert.equal(initialTriggers.length,2)
async function mustFail(sql,message){let failed=false;try{await db.exec(sql)}catch(error){failed=true;assert.match(error.message,message)}finally{await db.exec('ROLLBACK')}assert(failed,'Expected error did not occur')}
await mustFail(`BEGIN;DELETE FROM public.biosites WHERE id='${targets[0]}'`,/cannot be deleted/)
await mustFail(`BEGIN;DELETE FROM public.biosite_revisions WHERE biosite_id='${targets[0]}'`,/immutable/)
await verify();console.log('Exclusão com proteções ativas bloqueada nos dois casos')
const plan=await fs.readFile('artifacts/neon-cleanup/proposed-cleanup.sql','utf8')
// Test the exact plan with forced exceptions at each risky boundary.
const stages=[['afterSuspend','SET CONSTRAINTS biosites_draft_fk, biosites_published_fk DEFERRED;'],['afterRevisionDeletion',/DELETE FROM public\.biosite_revisions[^;]+;/],['afterSiteDeletion',/DELETE FROM public\.biosites[^;]+;/],['afterRestore','ALTER TABLE public.biosites ENABLE TRIGGER biosites_guard;']]
const errors=[]
for(const [name,boundary] of stages){const injected=plan.replace(boundary,match=>match+"\nDO $forced$ BEGIN RAISE EXCEPTION 'isolated forced error'; END $forced$;");assert.notEqual(injected,plan);await mustFail(injected,/isolated forced error/);assert.deepEqual(await triggerState(),initialTriggers);await verify();errors.push(name);console.log('Rollback comprovado: '+name)}
await db.exec(plan)
const preserved=await verify(true);assert.deepEqual(preserved,{sites:7,revisions:217});assert.deepEqual(await triggerState(),initialTriggers)
assert.equal((await db.query('SELECT count(*)::int AS n FROM public.biosites WHERE id=ANY($1::uuid[])',[targets])).rows[0].n,0)
await db.close();db=new PGlite(dir);assert.deepEqual(await verify(true),preserved);assert.deepEqual(await triggerState(),initialTriggers);await db.close()
const result={verifiedAt:new Date().toISOString(),engine:'PGlite embedded PostgreSQL',databasePath:dir,productionConnectionUsed:false,backupSHA256FilesVerified:Object.keys(files).length,backupRestoredAndReopened:restored,allContentCompared:true,guardsBlockDeletion:true,forcedRollbackStages:errors,guardsRestoredOnEveryRollback:true,exactPlanSuccessful:true,preservedContentAfterSimulatedCleanup:preserved,guardsEnabledAfterCommitAndReopen:true,targetIds:targets,productionDeletes:0,productionDDL:0,deployExecuted:false}
await fs.writeFile('artifacts/neon-cleanup/isolated-validation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2))
