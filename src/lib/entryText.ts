import type {Section} from '../types/biosite'
// String-backed legacy entries retain their content identity when reordered.
export function entryTextKey(collection:string,value:string){let a=2166136261,b=5381;for(let i=0;i<value.length;i++){a=Math.imul(a^value.charCodeAt(i),16777619);b=Math.imul(b,33)^value.charCodeAt(i)}return collection+'-'+(a>>>0).toString(16)+'-'+(b>>>0).toString(16)}
export function entryTextOwner(section:Section,collection:string,value:string){return {textOptions:section.entryTextOptions?.[entryTextKey(collection,value)]}}
