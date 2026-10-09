// SELECT-only inventory and chunked backup. No DELETE/UPDATE/DDL.
import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {neon} from '@neondatabase/serverless'
import {serverConfig} from '../server/config.mjs'
import {connectRepository} from '../server/repository.mjs'
import {auditDraftIds} from '../server/publication.mjs'
await connectRepository()
const config=await serverConfig(),sql=neon(config.DATABASE_URL),options=()=>({readOnly:true,fetchOptions:{signal:AbortSignal.timeout(30000)}})
const fingerprints=()=>sql.transaction([
 sql`SELECT id,md5(row_to_json(b)::text) AS hash FROM public.biosites b ORDER BY id`,
 sql`SELECT biosite_id,version::text AS version,md5(row_to_json(r)::text) AS hash FROM public.biosite_revisions r ORDER BY biosite_id,version`,
],options())
const baseline=await fingerprints()
if(baseline[0].length!==14||baseline[1].length!==269)throw Error('Totais mudaram; revisar inventário anterior.')
const [sites,admins,assets,columns,triggers]=await sql.transaction([
 sql`SELECT * FROM public.biosites ORDER BY id`,sql`SELECT * FROM public.biosite_admin ORDER BY id`,sql`SELECT * FROM public.biosite_assets ORDER BY id`,
 sql`SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name LIKE 'biosite%' ORDER BY table_name,ordinal_position`,
 sql`SELECT c.relname AS table_name,t.tgname AS trigger_name,pg_get_triggerdef(t.oid) AS definition,pg_get_functiondef(t.tgfoid) AS function_definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname LIKE 'biosite%' AND NOT t.tgisinternal ORDER BY c.relname,t.tgname`,
],options())
const hash=value=>createHash('sha256').update(value).digest('hex'),directory='artifacts/neon-cleanup/backup-'+new Date().toISOString().replace(/[:.]/g,'-')
await fs.mkdir(directory+'/revisions',{recursive:true});const files={},inventory=[]
const backup=async(name,data)=>{const bytes=JSON.stringify(data,null,2),path=directory+'/'+name+'.json';await fs.writeFile(path,bytes);const reread=await fs.readFile(path);if(hash(reread)!==hash(bytes))throw Error('Backup hash mismatch');files[name]={path,rows:Array.isArray(data)?data.length:1,bytes:reread.length,sha256:hash(reread)}}
for(const [name,data] of Object.entries({biosites:sites,admin:admins,assets,columns,triggers,fingerprints:baseline}))await backup(name,data)
console.log('Backup por revisão iniciado: 14 BioSites, 269 revisões; SELECT somente.')
let count=0
for(const fingerprint of baseline[1]){
 const [rows]=await sql.transaction([sql`SELECT r.*,md5(row_to_json(r)::text) AS backup_source_hash FROM public.biosite_revisions r WHERE biosite_id=${fingerprint.biosite_id}::uuid AND version=${fingerprint.version}::bigint`],options())
 const row=rows[0];if(!row||row.backup_source_hash!==fingerprint.hash)throw Error('Fonte mudou durante backup; revisar antes de excluir.');delete row.backup_source_hash
 await backup('revisions/'+row.biosite_id+'-'+row.version,row)
 const site=sites.find(x=>x.id===row.biosite_id)
 if(String(row.version)===String(site.draft_revision)){const name=row.content.name,audit=auditDraftIds.has(site.id)&&/TESTE\s+AUDITORIA/i.test(name),automatic=/^\[?Teste autom[aá]tico/i.test(name),versions=baseline[1].filter(x=>x.biosite_id===site.id).map(x=>x.version)
  inventory.push({id:site.id,name,category:row.content.category,templateId:row.template_id,status:site.status,slug:site.slug,revisions:versions.length,revisionVersions:versions,recommendation:audit||automatic?'EXCLUIR SOMENTE APÓS APROVAÇÃO ESPECÍFICA':'PRESERVAR',classification:audit?'Teste de auditoria confirmado':automatic?'Nome explicitamente marcado como teste automático':'Possível cliente ou demonstrativo; não classificado',createdAt:site.created_at,updatedAt:site.updated_at})
 }
 count++;if(count%20===0||count===269)console.log('Revisões copiadas e verificadas: '+count+'/269')
}
if(hash(JSON.stringify(baseline))!==hash(JSON.stringify(await fingerprints())))throw Error('Fonte mudou durante backup; manter arquivos e revisar.')
const manifest={createdAt:new Date().toISOString(),readOnly:true,projectId:config.NEON_PROJECT_ID,branchId:config.NEON_BRANCH_ID,sourceComparedTwice:true,backupFilesRereadAndHashed:true,sites:sites.length,revisions:269,assets:assets.length,files,inventory,deleteExecuted:false,restorationTestExecuted:false}
await backup('manifest',manifest);await fs.writeFile('artifacts/neon-cleanup/inventory.json',JSON.stringify(manifest,null,2))
console.log(JSON.stringify({backup:directory,verified:true,sites:14,revisions:269,deleteExecuted:false,inventory},null,2))
