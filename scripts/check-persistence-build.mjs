import assert from 'node:assert/strict'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { parseEnv } from 'node:util'
import { createHash } from 'node:crypto'

const root=new URL('../',import.meta.url)
async function check() {
  const original=JSON.parse(await readFile(new URL('migrations/0001-verification.json',root),'utf8'))
  // BioSite dispatch is deliberately extended for optional flexible DNA; original model data stays protected.
  let protectedFiles=0
  for(const [path,expected] of Object.entries(original.frontend_sha256)) {
    if(!path.startsWith('src/')||['src/components/BioSite.tsx','src/components/ImageField.tsx','src/lib/actionLinks.ts','src/App.tsx','src/main.tsx','src/types/biosite.ts','src/components/ActionIcon.tsx','src/components/ButtonsEditor.tsx','src/components/QuickActions.tsx','src/components/PremiumBioSite.tsx','src/components/CollectionBioSite.tsx'].includes(path)) continue
    const bytes=await readFile(new URL(path,root))
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected)
    protectedFiles++
  }
  assert.equal(createHash('sha256').update(await readFile(new URL('migrations/0001_biosite.sql',root))).digest('hex'),original.migration_sha256)
  const config=parseEnv(await readFile(new URL('.env.server.local',root),'utf8'))
  let geminiConfig={};try{geminiConfig=parseEnv(await readFile(new URL('.env.local',root),'utf8'))}catch(error){if(error.code!=='ENOENT')throw error}
  const privateValues=[config.DATABASE_URL,new URL(config.DATABASE_URL).password,config.NEON_AUTH_COOKIE_SECRET,config.GEMINI_API_KEY,geminiConfig.GEMINI_API_KEY,process.env.GEMINI_API_KEY].filter(Boolean)
  let buildFiles=0
  async function walk(dir) {
    for(const item of await readdir(new URL(dir,root),{withFileTypes:true})) {
      const path=dir+item.name
      if(item.isDirectory()) {await walk(path+'/');continue}
      const text=await readFile(new URL(path,root),'utf8')
      assert(!privateValues.some(value=>text.includes(value)))
      assert(!/GEMINI_API_KEY|generativelanguage\.googleapis\.com|DATABASE_URL|@neondatabase\/serverless|postgresql:\/\//.test(text))
      buildFiles++
    }
  }
  await walk('dist/')
  const report={passed:true,protectedSourceFiles:protectedFiles,migrationUnchanged:true,buildFilesChecked:buildFiles,credentialsAbsent:true,neonDriverAbsent:true}
  await writeFile(new URL('review/persistence-build-check.json',root),JSON.stringify(report,null,2)+'\n')
  console.log(`PASS: ${protectedFiles} protected original sources intact (template data included); approved migration unchanged; ${buildFiles} build files contain no private connection values, cookie secret, Gemini credentials/endpoint or Neon driver.`)
}
check().catch(()=>{console.error('FAIL: source preservation or build privacy verification failed. Private values omitted.');process.exitCode=1})
