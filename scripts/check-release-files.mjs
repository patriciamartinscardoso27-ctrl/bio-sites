import fs from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {serverConfig} from '../server/config.mjs'
import {parseEnv} from 'node:util'
const config=await serverConfig(),client=parseEnv(await fs.readFile('.env.local','utf8'))
const secrets=[config.DATABASE_URL,config.NEON_AUTH_COOKIE_SECRET,client.GEMINI_API_KEY,client.VERCEL_OIDC_TOKEN].filter(x=>x&&x.length>20)
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)
let bytes=0
for(const path of files){if(/^(artifacts|review|node_modules|dist|\.vercel)\//.test(path)||/^\.env(?:\.local|\.server\.local)?$/.test(path))throw Error('Arquivo privado seria incluído: '+path)
 const buffer=await fs.readFile(path);bytes+=buffer.length;for(const secret of secrets)if(buffer.includes(Buffer.from(secret)))throw Error('Valor privado encontrado em arquivo de release: '+path)
 if(path==='.npmrc'&&/_authToken\s*=\s*[^\s$]+/.test(buffer.toString()))throw Error('Verificar autenticação npm antes de publicar')
}
for(const path of (await fs.readdir('dist/assets')).filter(x=>x.endsWith('.js')))for(const secret of secrets)if((await fs.readFile('dist/assets/'+path)).includes(Buffer.from(secret)))throw Error('Valor privado presente no bundle')
console.log(JSON.stringify({files:files.length,totalBytes:bytes,privateValuesFound:0,localEvidenceExcluded:true,bundleChecked:true}))
