// SELECT ONLY. Supplement exact PostgreSQL timestamps without JS Date truncation.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {neon} from '@neondatabase/serverless'
import {connectRepository} from '../server/repository.mjs'
import {serverConfig} from '../server/config.mjs'
await connectRepository();const config=await serverConfig(),sql=neon(config.DATABASE_URL)
const i=JSON.parse(await fs.readFile('artifacts/neon-cleanup/inventory.json','utf8'))
const baseline=JSON.parse(await fs.readFile(i.files.fingerprints.path,'utf8'))
const [sites,revisions,admin,siteHashes,revisionHashes]=await sql.transaction([
 sql`SELECT id,created_at::text,updated_at::text,published_at::text,unpublished_at::text FROM public.biosites ORDER BY id`,
 sql`SELECT biosite_id,version::text,created_at::text FROM public.biosite_revisions ORDER BY biosite_id,version`,
 sql`SELECT id,created_at::text FROM public.biosite_admin ORDER BY id`,
 sql`SELECT id,md5(row_to_json(b)::text) AS hash FROM public.biosites b ORDER BY id`,
 sql`SELECT biosite_id,version::text AS version,md5(row_to_json(r)::text) AS hash FROM public.biosite_revisions r ORDER BY biosite_id,version`,
],{readOnly:true,fetchOptions:{signal:AbortSignal.timeout(30000)}})
assert.deepEqual(siteHashes,baseline[0]);assert.deepEqual(revisionHashes,baseline[1])
const path='artifacts/neon-cleanup/timestamp-precision.json',data=JSON.stringify({sites,revisions,admin},null,2)
await fs.writeFile(path,data);const sha256=createHash('sha256').update(await fs.readFile(path)).digest('hex');assert.equal(sha256,createHash('sha256').update(data).digest('hex'))
await fs.writeFile('artifacts/neon-cleanup/timestamp-precision-manifest.json',JSON.stringify({verifiedAt:new Date().toISOString(),path,sha256,sites:14,revisions:269,admin:1,sourceMatchesOriginalBackup:true,readOnly:true},null,2));console.log('Complemento de precisão verificado; SELECT somente; 14/269 inalterados.')
