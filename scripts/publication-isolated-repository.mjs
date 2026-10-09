// Explicit local demonstration/test adapter. Never connects to Neon.
import fs from 'node:fs/promises'
import {ApiError,slugFor,validateBio,validateVersion} from '../server/validation.mjs'
import {assertPublishable,validateSlug,publicContent} from '../server/publication.mjs'
export async function isolatedRepository(path){
 let state={sites:{},revisions:{}};try{state=JSON.parse(await fs.readFile(path,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
 const write=()=>fs.writeFile(path,JSON.stringify(state,null,2)),get=id=>{const row=state.sites[id];if(!row)throw new ApiError(404,'BioSite não encontrado.');return structuredClone({...row,content:state.revisions[id][row.draftRevision]})},check=(id,version)=>{validateVersion(version);const row=state.sites[id];if(!row)throw new ApiError(404,'BioSite não encontrado.');if(row.lockVersion!==version)throw new ApiError(409,'Este BioSite mudou. Reabra antes de continuar.');return row},touch=row=>{row.lockVersion=String(BigInt(row.lockVersion)+1n);row.updatedAt=new Date().toISOString()}
 return {publicationWritesEnabled:true,
  async list(){return {items:Object.values(state.sites).map(row=>({...row,...Object.fromEntries(['name','category','style','layoutPreset','logo','phone','address'].map(k=>[k,state.revisions[row.id][row.draftRevision][k]]))})),nextCursor:null}},
  async get(id){return get(id)},
  async create(content){const templateId=validateBio(content),slug=validateSlug(slugFor(content));if(state.sites[content.id]){if(JSON.stringify(get(content.id).content)!==JSON.stringify(content))throw new ApiError(409,'ID existente.');return get(content.id)}if(Object.values(state.sites).some(r=>r.slug===slug))throw new ApiError(409,'Endereço existente.');const now=new Date().toISOString();state.sites[content.id]={id:content.id,slug,status:'unpublished',lockVersion:'1',draftRevision:'1',publishedRevision:null,publishedAt:null,createdAt:now,updatedAt:now,templateId};state.revisions[content.id]={'1':structuredClone(content)};await write();return get(content.id)},
  async save(id,content,version){validateBio(content,id);const row=check(id,version);row.draftRevision=String(BigInt(row.draftRevision)+1n);state.revisions[id][row.draftRevision]=structuredClone(content);touch(row);await write();return get(id)},
  async publish(id,version,draftRevision){const row=check(id,version);assertPublishable(get(id));if(row.draftRevision!==draftRevision)throw new ApiError(409,'Rascunho mudou.');row.status='published';row.publishedRevision=row.draftRevision;row.publishedAt=new Date().toISOString();touch(row);await write();return get(id)},
  async unpublish(id,version){const row=check(id,version);assertPublishable(get(id));row.status='unpublished';touch(row);await write();return get(id)},
  async getPublished(slug){validateSlug(slug);const row=Object.values(state.sites).find(r=>r.slug===slug&&r.status==='published');if(!row)throw new ApiError(404,'Página não encontrada.');return {slug,revision:row.publishedRevision,publishedAt:row.publishedAt,content:publicContent(state.revisions[row.id][row.publishedRevision])}}
 }
}
