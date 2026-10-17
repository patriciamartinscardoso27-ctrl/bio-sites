export type TemplateFieldType='text'|'price'|'image'|'link'|'whatsapp'
export interface TemplateField {type:TemplateFieldType;label:string;maxLength?:number;message?:string;globalField?:string;bioField?:'name'|'phone'|'address'|'instagram'}
export interface TemplateItem {id:string;values:Record<string,string>}
export interface TemplateContent {fields:Record<string,string>;collections:Record<string,TemplateItem[]>}
export interface TemplateManifest {format:'biosite-isolated-template';version:1;name:string;html:'template.html';css:'styles.css';business:{name:string;category:string;phone:string;address:string};fields:Record<string,TemplateField>;collections:Record<string,{label:string;fields:Record<string,TemplateField>;maxItems:number}>;content:TemplateContent}
export interface TemplateAsset {path:string;mime:string;data?:string;url?:string;sha256:string}
export interface IsolatedTemplate {version:1;manifest:TemplateManifest;html:string;css:string;license:string;assets:TemplateAsset[];digest:string;storageProof?:string}
export const templateLimits={zipBytes:20_000_000,expandedBytes:40_000_000,persistedBytes:3_700_000,workingBytes:58_000_000,files:80,items:40,htmlBytes:150_000,cssBytes:150_000} as const
export function assetUrl(pack:IsolatedTemplate,path:string){const asset=pack.assets.find(a=>a.path===path);if(!asset)throw Error('Mídia ausente: '+path);return asset.url||`data:${asset.mime};base64,${asset.data}`}
export function mediaUrl(pack:IsolatedTemplate,value:string){return value.startsWith('assets/')?assetUrl(pack,value):value}
export const fieldId=/^[a-z][a-z0-9_-]{0,49}$/
export function safeTemplateLink(value:string){if(/^#[a-zA-Z][\w-]*$/.test(value))return true;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!/^(localhost|127\.|10\.|192\.168\.|\[|0\.)/i.test(u.hostname)}catch{return false}}
export function fieldLink(field:TemplateField,value:string,values:Record<string,string>){if(field.type==='whatsapp'){const digits=value.replace(/\D/g,'');const message=(field.message||'').replace(/\{\{([a-z][a-z0-9_-]*)\}\}/g,(_,id)=>values[id]||'');return 'https://wa.me/'+digits+(message?'?text='+encodeURIComponent(message):'')}return value}
