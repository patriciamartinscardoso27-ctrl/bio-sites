// Read-only inventory and byte-verifiable backup. Never issues DELETE/UPDATE/DDL.
import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {neon} from '@neondatabase/serverless'
import {serverConfig} from '../server/config.mjs'
import {connectRepository} from '../server/repository.mjs'
import {auditDraftIds} from '../server/publication.mjs'
await connectRepository() // Enforces the existing exact Bio Sites project/branch guard.
const config=await serverConfig(),sql=neon(config.DATABASE_URL)
const queries=()=>[
 sql`SELECT * FROM public.biosites ORDER BY id`,
 sql`SELECT * FROM public.biosite_revisions ORDER BY biosite_id,version`,
 sql`SELECT * FROM public.biosite_admin ORDER BY id`,
 sql`SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('biosites','biosite_revisions','biosite_admin') ORDER BY table_name,ordinal_position`,
 sql`SELECT c.relname AS table_name,t.tgname AS trigger_name,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('biosites','biosite_revisions','biosite_admin') AND NOT t.tgisinternal ORDER BY c.relname,t.tgname`,
]
const options={isolationLevel:'RepeatableRead',readOnly:true,fetchOptions:{signal:AbortSignal.timeout(30000)}}
const snapshot=await sql.transaction(queries(),options),[sites,revisions,admins,columns,triggers]=snapshot
if(sites.length!==14||revisions.length!==269)throw Error('Totais mudaram; não presumir o inventário anterior.')
const hash=value=>createHash('sha256').update(value).digest('hex'),stamp=new Date().toISOString().replace(/[:.]/g,'-'),directory='artifacts/neon-cleanup/backup-'+stamp
await fs.mkdir(directory,{recursive:true})
const files={};for(const [name,data] of Object.entries({biosites:sites,revisions,admin:admins,columns,triggers})){
 const bytes=JSON.stringify(data,null,2),path=directory+'/'+name+'.json';await fs.writeFile(path,bytes);const reread=await fs.readFile(path);if(hash(reread)!==hash(bytes))throw Error('Backup hash mismatch');files[name]={path,rows:data.length,bytes:reread.length,sha256:hash(reread)}
}
const second=await sql.transaction(queries(),options);if(hash(JSON.stringify(snapshot))!==hash(JSON.stringify(second)))throw Error('Fonte mudou durante backup; manter arquivos, revisar antes de excluir.')
const inventory=sites.map(site=>{const rows=revisions.filter(r=>r.biosite_id===site.id),draft=rows.find(r=>String(r.version)===String(site.draft_revision)),name=draft?.content?.name||'',audit=auditDraftIds.has(site.id)&&/TESTE\s+AUDITORIA/i.test(name)
 return {id:site.id,name,category:draft?.content?.category,templateId:draft?.template_id,status:site.status,slug:site.slug,revisions:rows.length,revisionVersions:rows.map(r=>String(r.version)),recommendation:audit?'EXCLUIR SOMENTE APÓS APROVAÇÃO ESPECÍFICA':'PRESERVAR',classification:audit?'Teste de auditoria confirmado':/teste|demo|exemplo/i.test(name)?'Possível demonstrativo; origem não confirmada':'Possível cliente ou demonstrativo; não classificado',createdAt:site.created_at,updatedAt:site.updated_at}
})
const manifest={createdAt:new Date().toISOString(),readOnly:true,projectId:config.NEON_PROJECT_ID,branchId:config.NEON_BRANCH_ID,sourceComparedTwice:true,backupFilesRereadAndHashed:true,sites:sites.length,revisions:revisions.length,files,inventory,deleteExecuted:false,restorationTestExecuted:false}
await fs.writeFile(directory+'/manifest.json',JSON.stringify(manifest,null,2));await fs.writeFile('artifacts/neon-cleanup/inventory.json',JSON.stringify(manifest,null,2))
console.log(JSON.stringify({backup:directory,verified:true,sites:sites.length,revisions:revisions.length,deleteExecuted:false,inventory},null,2))
