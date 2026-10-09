import fs from 'node:fs/promises'
import {parseEnv} from 'node:util'
import assert from 'node:assert/strict'
import {neon} from '@neondatabase/serverless'
const config=parseEnv(await fs.readFile(new URL('../.env.server.local',import.meta.url),'utf8')),url=new URL(config.DATABASE_URL)
assert.equal(config.NEON_PROJECT_ID,'muddy-star-65783442');assert.equal(config.NEON_BRANCH_ID,'br-raspy-pine-b4i56qaa');assert.equal(url.hostname,'ep-cool-flower-b4g5hcwp-pooler.c-6.us-east-2.aws.neon.tech');assert.equal(url.pathname,'/neondb');assert(['require','verify-full'].includes(url.searchParams.get('sslmode')))
const read=async()=>{const sql=neon(config.DATABASE_URL);return sql.transaction([
sql`SELECT current_setting('transaction_read_only') AS read_only`,
sql`SELECT b.id,b.status,b.lock_version::text AS lock_version,b.draft_revision::text AS draft_revision,b.published_revision::text AS published_revision,r.template_id,r.content->>'layoutPreset' AS layout_preset,md5(r.content::text) AS content_hash,octet_length(r.content::text)::int AS content_bytes FROM public.biosites b LEFT JOIN public.biosite_revisions r ON r.biosite_id=b.id AND r.version=b.draft_revision ORDER BY b.id`,
sql`SELECT count(*)::int AS revisions FROM public.biosite_revisions`,
sql`SELECT tgname FROM pg_trigger WHERE tgrelid='public.biosites'::regclass AND NOT tgisinternal ORDER BY tgname`
],{readOnly:true,fetchOptions:{signal:AbortSignal.timeout(20000)}})}
try{const first=await read(),reopened=await read();assert.equal(first[0][0].read_only,'on');assert.equal(reopened[0][0].read_only,'on');assert.deepEqual(first[1],reopened[1]);for(const r of first[1])assert(r.content_hash&&r.template_id&&Number(r.draft_revision)>0)
const report={timestamp:new Date().toISOString(),transactionReadOnly:true,separateConnectionsEqual:true,sites:first[1].length,revisions:first[2][0].revisions,published:first[1].filter(r=>r.status==='published').length,records:first[1],triggers:first[3].map(r=>r.tgname),writesExecuted:false,newSaveVerified:false}
await fs.mkdir('artifacts/functional-audit',{recursive:true});await fs.writeFile('artifacts/functional-audit/neon-readonly.json',JSON.stringify(report,null,2));console.log(JSON.stringify({readOnly:true,sites:report.sites,revisions:report.revisions,published:report.published,separateConnectionsEqual:true,writesExecuted:false,newSaveVerified:false}))
}catch{console.error('Não foi possível concluir a leitura somente leitura do Neon. Nenhuma escrita foi executada.');process.exitCode=1}
