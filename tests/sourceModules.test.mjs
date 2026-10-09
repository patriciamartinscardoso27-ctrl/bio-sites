import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

test('scoped resolver supports original TS and Vercel JS graphs, including dynamic imports',async()=>{
 await fs.mkdir('artifacts/multiuser',{recursive:true})
 const dir=await fs.mkdtemp('artifacts/multiuser/resolver-test-')
 try {
  await fs.mkdir(dir+'/src',{recursive:true})
  await fs.mkdir(dir+'/outside',{recursive:true})
  await fs.writeFile(dir+'/package.json','{"type":"module"}')
  await fs.writeFile(dir+'/src/source.ts','export const value:number=1')
  await fs.writeFile(dir+'/src/emitted.js','export const value=2')
  await fs.writeFile(dir+'/src/transitive.js',"export {value} from './emitted'")
  await fs.writeFile(dir+'/outside/hidden.js','export const value=3')
  await fs.writeFile(dir+'/run.mjs',`import assert from 'node:assert/strict';
   import ${JSON.stringify(pathToFileURL(resolve('server/source-modules.mjs')).href)};
   assert.equal((await import('./src/source.ts')).value,1);
   assert.equal((await import('./src/emitted.ts')).value,2);
   assert.equal((await import('./src/transitive.ts')).value,2);
   await assert.rejects(import('./outside/hidden.ts'),{code:'ERR_MODULE_NOT_FOUND'});
   await assert.rejects(import('./src/missing.ts'),{code:'ERR_MODULE_NOT_FOUND'});`)
  const run=spawnSync(process.execPath,['run.mjs'],{cwd:dir,encoding:'utf8'})
  assert.equal(run.status,0,run.stderr)
 } finally { await fs.rm(dir,{recursive:true,force:true}) }
})
