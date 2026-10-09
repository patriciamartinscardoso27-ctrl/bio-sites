// Separate loopback-only fixture server; production auth/API are never bypassed.
import {createServer} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {validateBio} from '../server/validation.mjs'
import {summarize} from '../src/lib/biositesApi.ts'
const {templates,createBio}=await import('../src/data/templates.ts')
const stored=new Map(),revisions=new Map()
const record=(bio,old)=>({id:bio.id,content:structuredClone(bio),templateId:validateBio(bio),slug:old?.slug||'cliente-'+bio.id,status:'unpublished',lockVersion:String(Number(old?.lockVersion||0)+1),draftRevision:String(Number(old?.draftRevision||0)+1),publishedRevision:null,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),publishedAt:null})
for(const template of [templates[0],templates[3]]){const bio=createBio(template);bio.name=template.categoryId==='fashion'?'Ateliê Aurora':'Barbearia Horizonte';bio.phone='5511999999999';bio.client={city:'São Paulo',notes:'Fixture isolada'};stored.set(bio.id,record(bio))}
const app=await createServer({configFile:false,root:process.cwd(),server:{host:'127.0.0.1',port:5189,strictPort:true,fs:{deny:['.env','.env.*','**/server/**','**/migrations/**']}},plugins:[react(),tailwindcss(),{name:'isolated-admin-review',transformIndexHtml:(_html,context)=>['/review/dna.html','/review/crop.html'].includes(context.path)?[]:[{tag:'script',attrs:{type:'module',src:'/review/admin-browser-fixture.tsx'},injectTo:'body'}],configureServer(server){server.middlewares.use(async(req,res,next)=>{
  if(req.url==='/'||req.url?.startsWith('/?')){res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/', '<html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Admin · teste isolado</title></head><body><div id="root"></div></body></html>'));return}
  if(req.url==='/__review/results'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({isolated:true,sites:[...stored.values()].map(r=>({id:r.id,name:r.content.name,revision:r.draftRevision,slug:r.slug,phone:r.content.phone,city:r.content.client?.city,notes:r.content.client?.notes})),revisions:[...revisions]}));return}
  if(!req.url?.startsWith('/api/biosites'))return next()
  const reply=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
  try{const id=req.url.split('/')[3]
    if(req.method==='GET'){if(!id)return reply(200,{items:[...stored.values()].map(summarize),nextCursor:null});return stored.has(id)?reply(200,stored.get(id)):reply(404,{error:'Fixture ausente'})}
    const chunks=[];for await(const chunk of req)chunks.push(chunk);const value=JSON.parse(Buffer.concat(chunks).toString())
    validateBio(value.content,id)
    const old=stored.get(value.content.id)
    if(req.method==='PUT'&&value.lockVersion!==old?.lockVersion)return reply(409,{error:'Versão antiga. Recarregue.'})
    if(req.method==='POST'&&old)return reply(409,{error:'ID já existente'})
    const saved=record(value.content,old);stored.set(saved.id,saved);revisions.set(saved.id,Number(saved.draftRevision));reply(req.method==='POST'?201:200,saved)
  }catch{reply(400,{error:'Conteúdo inválido no teste'})}
})}}]})
await app.listen();console.log('Isolated UI fixtures: http://127.0.0.1:5189 (no Neon or account changes)')
