// SELECT-only guard before/after the explicitly approved three-fixture test.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {parseEnv} from 'node:util'
import {neon} from '@neondatabase/serverless'
import {connectRepository} from '../server/repository.mjs'
await connectRepository() // Enforce the existing project's connection checks.
const config=parseEnv(await fs.readFile('.env.server.local','utf8')),sql=neon(config.DATABASE_URL)
const [mode,sites,revisions,structure]=await sql.transaction([
 sql`SELECT current_setting('transaction_read_only') AS mode`,
 sql`SELECT id,md5(row_to_json(b)::text) AS hash FROM public.biosites b ORDER BY id`,
 sql`SELECT biosite_id,version::text AS version,md5(row_to_json(r)::text) AS hash FROM public.biosite_revisions r ORDER BY biosite_id,version`,
 sql`SELECT md5(string_agg(column_name||':'||data_type||':'||is_nullable,',' ORDER BY table_name,ordinal_position)) AS hash FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('biosites','biosite_revisions','biosite_admin')`
],{readOnly:true,fetchOptions:{signal:AbortSignal.timeout(20000)}})
assert.equal(mode[0].mode,'on')
const path='artifacts/functional-audit/neon-protected-baseline.json',current={sites,revisions,structure}
if(process.argv.includes('--baseline')){
 try{await fs.access(path);throw Error('Baseline already exists; refuse overwrite')}catch(e){if(e.code!=='ENOENT')throw e}
 assert.equal(sites.length,11);assert.equal(revisions.length,262)
 const plan=JSON.parse(await fs.readFile('artifacts/functional-audit/neon-write-plan.json','utf8'));assert(plan.fixtures.every(f=>!sites.some(s=>s.id===f.id)))
 await fs.writeFile(path,JSON.stringify(current,null,2));console.log('BASELINE: 11 BioSites, 262 revisions; SELECT only; reserved IDs unused.')
}else{
 const baseline=JSON.parse(await fs.readFile(path,'utf8')),plan=JSON.parse(await fs.readFile('artifacts/functional-audit/neon-write-plan.json','utf8')),ids=plan.fixtures.map(f=>f.id)
 for(const original of baseline.sites)assert.deepEqual(sites.find(s=>s.id===original.id),original,'Existing BioSite changed')
 for(const original of baseline.revisions)assert.deepEqual(revisions.find(r=>r.biosite_id===original.biosite_id&&r.version===original.version),original,'Existing revision changed')
 assert.deepEqual(structure,baseline.structure);const added=sites.filter(s=>!baseline.sites.some(o=>o.id===s.id));assert(added.length<=3&&added.every(s=>ids.includes(s.id)));const newRevisions=revisions.filter(r=>!baseline.revisions.some(o=>o.biosite_id===r.biosite_id&&o.version===r.version));assert(newRevisions.length<=11&&newRevisions.every(r=>ids.includes(r.biosite_id)))
 const report={verifiedAt:new Date().toISOString(),readOnly:true,originalSitesUnchanged:11,originalRevisionsUnchanged:262,structureUnchanged:true,newSites:added.length,newRevisions:newRevisions.length,ids:added.map(s=>s.id),deletedRecords:0}
 await fs.writeFile('artifacts/functional-audit/neon-protection-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}
