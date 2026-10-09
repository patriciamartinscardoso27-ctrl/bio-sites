import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApi, createAdminPageGuard, localRequest, canonicalLocalPage } from './api.mjs'

const defaultDist = fileURLToPath(new URL('../dist/',import.meta.url))
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'}
export function createAppServer({dist=defaultDist,api=createApi(),pageGuard=createAdminPageGuard(),canonical=canonicalLocalPage}={}) {
  const server=createServer((req,res)=>{
    if (!localRequest(req)) {res.writeHead(403);res.end('Acesso local somente.');return}
    void canonical(req,res,()=>void api(req,res,()=>void pageGuard(req,res,()=>void (async ()=>{
      if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return}
      try {
        const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
        const file=resolve(dist,['/','/login','/admin','/forgot-password','/reset-password'].includes(path)||/^\/b\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)?'index.html':'.'+path)
        if (!file.startsWith(resolve(dist)+sep)) {res.writeHead(404);res.end();return}
        const data=await readFile(file)
        res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'})
        res.end(req.method==='HEAD'?undefined:data)
      } catch {res.writeHead(404);res.end('Não encontrado.')}
    })())))
  })
  server.requestTimeout=30000
  return server
}
