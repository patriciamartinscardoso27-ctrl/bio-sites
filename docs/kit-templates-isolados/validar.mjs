import fs from 'node:fs/promises'
import {parseTemplateZip} from './validator/template-security.mjs'
const categories=JSON.parse(await fs.readFile(new URL('./categorias.json',import.meta.url),'utf8'))
if(!process.argv[2]){console.error('Uso: node validar.mjs arquivo.biosite.zip');process.exitCode=1}
for(const file of process.argv.slice(2)){try{const bytes=await fs.readFile(file),p=await parseTemplateZip(bytes);if(!categories.includes(p.manifest.business.category.toLowerCase()))throw Error('Categoria não suportada nesta versão do kit.');console.log(JSON.stringify({file,accepted:true,digest:p.digest,assets:p.assets.length,persisted:false}))}catch(e){console.error(JSON.stringify({file,accepted:false,error:e.message}));process.exitCode=1}}
