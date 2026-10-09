// Secrets travel through stdin, never shell arguments or logs. Only the linked Bio Sites project.
import fs from 'node:fs/promises'
import {parseEnv} from 'node:util'
import {spawn} from 'node:child_process'
import assert from 'node:assert/strict'
import {serverConfig} from '../server/config.mjs'
const link=JSON.parse(await fs.readFile('.vercel/project.json','utf8'))
assert.equal(link.projectId,'prj_Idyledxyv7MNB2CIZ9e2CCCH0P8k');assert.equal(link.orgId,'team_BQbcY7cLHYNqOeY8ogTqEXAa');assert.equal(link.projectName,'bio-sites')
const config=await serverConfig(),local=parseEnv(await fs.readFile('.env.local','utf8'))
const keys=['DATABASE_URL','NEON_PROJECT_ID','NEON_BRANCH_ID','NEON_DATABASE_NAME','NEON_DATABASE_HOST','NEON_AUTH_BASE_URL','NEON_AUTH_COOKIE_SECRET','BIOSITE_ADMIN_AUTH_ID']
const values=Object.fromEntries(keys.map(k=>[k,config[k]]))
values.PUBLIC_SITE_ORIGIN='https://bio-sites-sage.vercel.app'
values.BIOSITE_PUBLICATION_WRITES='enabled'
if(local.GEMINI_API_KEY)values.GEMINI_API_KEY=local.GEMINI_API_KEY
const configured=[]
for(const [key,value] of Object.entries(values)){
 const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7)
 if(only&&key!==only)continue
 assert(value,'Missing required value: '+key)
 await new Promise((resolve,reject)=>{
  const publicConfig=['PUBLIC_SITE_ORIGIN','BIOSITE_PUBLICATION_WRITES'].includes(key)
  const command='npx --yes vercel@latest env add '+key+' production '+(publicConfig?'--no-sensitive':'--sensitive')+' --yes --project prj_Idyledxyv7MNB2CIZ9e2CCCH0P8k --scope gabrielbotafogo006-5410'
  const child=spawn('cmd.exe',['/d','/s','/c',command],{stdio:['pipe','pipe','pipe'],windowsHide:true})
  child.stdout.on('data',()=>{});child.stderr.on('data',()=>{})
  child.on('error',()=>reject(Error('Vercel subprocess failed: '+key)))
  child.on('close',code=>code===0?resolve():reject(Error('Vercel configuration failed: '+key+' (exit '+code+')')))
  child.stdin.end(value)
 })
 configured.push(key);console.log('Configurada como segredo de produção: '+key)
}
await fs.mkdir('artifacts/deployment',{recursive:true})
await fs.writeFile('artifacts/deployment/environment-result.json',JSON.stringify({configuredAt:new Date().toISOString(),projectId:link.projectId,projectName:link.projectName,keys:configured,allServerOnly:true,valuesLogged:false,neonDataWrites:0},null,2))
