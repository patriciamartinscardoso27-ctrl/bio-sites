import type {Bio} from '../types/biosite'
import {sameBio,type SavedBioSite} from './biositesApi'
export interface DraftConflict {path:string;local:unknown;remote:unknown}
type Choices=Record<string,'local'|'remote'>
const equal=(a:unknown,b:unknown)=>sameBio(a as Bio,b as Bio)
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
export function reconcileDraft(base:Bio,local:Bio,remote:Bio,choices:Choices={}){
 const conflicts:DraftConflict[]=[]
 const conflict=(path:string,l:unknown,r:unknown)=>{if(!choices[path])conflicts.push({path,local:l,remote:r});return structuredClone(choices[path]==='remote'?r:l)}
 const merge=(b:unknown,l:unknown,r:unknown,path:string):unknown=>{
  if(equal(l,r)||equal(b,r))return structuredClone(l)
  if(equal(b,l))return structuredClone(r)
  if(object(b)&&object(l)&&object(r))return Object.fromEntries([...new Set([...Object.keys(b),...Object.keys(l),...Object.keys(r)])].map(k=>[k,merge(b[k],l[k],r[k],path+'/'+k)]).filter(([,v])=>v!==undefined))
  if(Array.isArray(b)&&Array.isArray(l)&&Array.isArray(r)&&[b,l,r].every(a=>a.every(v=>object(v)&&typeof v.id==='string')&&new Set(a.map(v=>v.id)).size===a.length)){
   const ids=(a:Record<string,unknown>[])=>a.map(v=>v.id as string),bi=ids(b),li=ids(l),ri=ids(r)
   let order:string[]=equal(li,bi)?ri:equal(ri,bi)||equal(li,ri)?li:conflict(path+'/$order',li,ri) as string[]
   order=[...new Set([...order,...ri,...li,...bi])]
   return order.map(id=>merge(b.find(v=>v.id===id),l.find(v=>v.id===id),r.find(v=>v.id===id),path+'/'+id)).filter(v=>v!==undefined)
  }
  return conflict(path,l,r)
 }
 return {content:merge(base,local,remote,'') as Bio,conflicts}
}
export class DraftConflictError extends Error{
 base:SavedBioSite;local:Bio;latest:SavedBioSite;conflicts:DraftConflict[]
 constructor(base:SavedBioSite,local:Bio,latest:SavedBioSite,conflicts:DraftConflict[]){super('Há alterações concorrentes nos mesmos campos. Revise as duas versões antes de salvar.');this.base=base;this.local=local;this.latest=latest;this.conflicts=conflicts}
}
export async function saveDraftWithRecovery(local:Bio,base:SavedBioSite|undefined,api:{get:(id:string)=>Promise<SavedBioSite>;save:(bio:Bio,lock:string)=>Promise<SavedBioSite>;create:(bio:Bio)=>Promise<SavedBioSite>},preserve:(bio:Bio,record?:SavedBioSite)=>void){
 if(!base)return api.create(local)
 try{return await api.save(local,base.lockVersion)}catch(error){
  if(!(error&&typeof error==='object'&&'status' in error&&error.status===409))throw error
  preserve(local,base)
  const latest=await api.get(local.id);preserve(latest.content,latest)
  const merged=reconcileDraft(base.content,local,latest.content)
  if(merged.conflicts.length)throw new DraftConflictError(base,local,latest,merged.conflicts)
  if(sameBio(merged.content,latest.content))return latest
  return api.save(merged.content,latest.lockVersion)
 }
}
