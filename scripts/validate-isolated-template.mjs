import fs from 'node:fs/promises'
import '../server/source-modules.mjs'
import {parseTemplateZip} from '../server/template-security.mjs'
for(const path of process.argv.slice(2)){try{const data=await fs.readFile(path),pack=await parseTemplateZip(data);console.log(JSON.stringify({file:path,accepted:true,digest:pack.digest,bytes:data.length,assets:pack.assets.length,persisted:false}))}catch(e){console.error(JSON.stringify({file:path,accepted:false,error:e.message}));process.exitCode=1}}
