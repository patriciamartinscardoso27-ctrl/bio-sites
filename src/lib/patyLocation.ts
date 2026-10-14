import type {Action,Bio} from '../types/biosite'
export function patyLocationUrl(bio:Bio){return bio.mapsUrl||bio.sections.flatMap(s=>[s.action,...(s.content?.actions||[])]).find(a=>a?.kind==='location'&&a.url)?.url||''}
export function patyLocationPatch(bio:Bio,patch:Partial<Bio>):Partial<Bio>{
 if(bio.layoutPreset!=='paty-galetos')return patch
 const connect=(a:Action):Action=>a.kind==='location'?{...a,source:'business',url:undefined}:a
 const address=patch.address??bio.address,mapsUrl=patch.mapsUrl??patyLocationUrl(bio)
 return {...patch,mapsUrl,actions:bio.actions.map(connect),sections:bio.sections.map(s=>({...s,action:s.action?connect(s.action):undefined,...(s.content?{content:{...s.content,...(s.content.actions?{actions:s.content.actions.map(connect)}:{}),...(s.kind==='location'?{address,mapsUrl}:{})}}:{})}))}
}
