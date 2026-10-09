import {demoAssets} from '../data/demoImages/index'
export type DemoRole='hero'|'ambiente'|'produto'|'servico'|'galeria'|'equipe'|'detalhe'|'promocao'
export interface DemoAsset{id:string;category:string;roles:DemoRole[];tags:string[];styles:string[];tones:('light'|'dark')[];orientation:'portrait'|'landscape'|'square'|'any';url:string;source:'existing-demo'|'local'}
function hash(value:string){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0}
export function demoImageSelector(category:string,style:string,tone:'light'|'dark',seed:string){
 const used=new Set<string>();let step=0
 return (role:DemoRole,orientation:DemoAsset['orientation']='any')=>{
  const categoryAssets=demoAssets.filter(a=>a.category===category),matching=categoryAssets.filter(a=>a.roles.includes(role)),pool=matching.length?matching:categoryAssets
  const unused=pool.filter(a=>!used.has(a.url)),alternatives=unused.length?unused:categoryAssets.filter(a=>!used.has(a.url)),candidates=alternatives.length?alternatives:pool
  const score=(a:DemoAsset)=>(a.roles.includes(role)?8:0)+(a.styles.includes(style)?2:0)+(a.tones.includes(tone)?2:0)+(a.orientation===orientation?1:0)
  const sorted=candidates.map(a=>({a,score:score(a)})).sort((a,b)=>b.score-a.score||a.a.id.localeCompare(b.a.id)),best=sorted[0]?.score??0,choices=sorted.filter(a=>a.score>=best-2)
  const chosen=choices[hash(seed+':'+role+':'+step++)%choices.length]?.a
  if(chosen)used.add(chosen.url);return chosen?.url||''
 }
}
