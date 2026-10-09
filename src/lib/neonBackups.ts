import type { Bio } from '../types/biosite'
import type { SavedBioSite } from './biositesApi'
import {gcm} from '@noble/ciphers/aes.js'

const prefix = 'vitrine-neon-backup-v1:'
let scope='',allowLegacy=true,encryptionKey:Uint8Array|undefined
function encode(bytes:Uint8Array){let text='';for(let i=0;i<bytes.length;i+=16384)text+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(text)}
function decode(value:string){return Uint8Array.from(atob(value),c=>c.charCodeAt(0))}
export function setBackupAccount(id:string,principal:boolean,key?:string){scope=encodeURIComponent(id)+':';allowLegacy=principal;encryptionKey=key&&/^[a-f0-9]{64}$/.test(key)?Uint8Array.from(key.match(/../g)!.map(x=>parseInt(x,16))):undefined}
export interface NeonBackup { content: Bio; saved?: SavedBioSite }
export function keepNeonBackup(content: Bio, saved?: SavedBioSite) {
  // Separate keys: never overwrite/import the legacy drafts key or other sites.
  const data=JSON.stringify({content,saved})
  if(encryptionKey){const nonce=crypto.getRandomValues(new Uint8Array(12));const encrypted=gcm(encryptionKey,nonce,new TextEncoder().encode(scope+content.id)).encrypt(new TextEncoder().encode(data));localStorage.setItem(prefix+scope+content.id,JSON.stringify({encrypted:1,nonce:encode(nonce),data:encode(encrypted)}))}
  else localStorage.setItem(prefix + scope + content.id,data)
}
export function readNeonBackups(): NeonBackup[] {
  const backups: NeonBackup[]=[]
  for(let i=0;i<localStorage.length;i++) {
    const key=localStorage.key(i)
    if(!key?.startsWith(prefix+scope)&&!(allowLegacy&&key?.startsWith(prefix)&&!key.slice(prefix.length).includes(':'))) continue
    try {
      let value=JSON.parse(localStorage.getItem(key)||'null')
      if(value?.encrypted){if(!encryptionKey)continue;const plain=gcm(encryptionKey,decode(value.nonce),new TextEncoder().encode(key.slice(prefix.length))).decrypt(decode(value.data));value=JSON.parse(new TextDecoder().decode(plain))}
      if(value?.content && typeof value.content.id==='string' && typeof value.content.name==='string'
        && ['sections','actions','products','services','photos','highlights','benefits'].every(k=>Array.isArray(value.content[k]))) backups.push(value)
    } catch { /* Keep unreadable backups intact. */ }
  }
  return backups
}
