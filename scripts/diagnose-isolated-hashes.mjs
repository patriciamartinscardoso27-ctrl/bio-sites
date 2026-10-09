import fs from 'node:fs/promises'
import {PGlite} from '../artifacts/neon-cleanup/isolated-runtime/node_modules/@electric-sql/pglite/dist/index.js'
const inventory=JSON.parse(await fs.readFile('artifacts/neon-cleanup/inventory.json','utf8'))
const baseline=JSON.parse(await fs.readFile(inventory.files.fingerprints.path,'utf8'))
const db=new PGlite('artifacts/neon-cleanup/isolated-postgres-1791522845498')
await db.exec("SET TIME ZONE 'UTC'")
for(const [table,index]of [['biosites',0],['biosite_revisions',1]]){const rows=(await db.query(`SELECT ${index===0?'id':'biosite_id,version::text AS version'},md5(row_to_json(t)::text) AS hash FROM public.${table} t`)).rows;console.log(JSON.stringify({table,rows:rows.length,hashMatches:rows.filter(r=>baseline[index].some(b=>(index===0?b.id===r.id:b.biosite_id===r.biosite_id&&b.version===r.version)&&b.hash===r.hash)).length}))}
await db.close()
