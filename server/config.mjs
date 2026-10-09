import {readFile} from 'node:fs/promises'
import {parseEnv} from 'node:util'
export async function serverConfig(){
 let local={};if(!process.env.VERCEL)try{local=parseEnv(await readFile(new URL('../.env.server.local',import.meta.url),'utf8'))}catch{/* Hosted configuration comes exclusively from environment variables. */}
 return {...local,...Object.fromEntries(Object.entries(process.env).filter(([,v])=>v!==undefined))}
}
export function configuredOrigin(value=process.env.PUBLIC_SITE_ORIGIN){if(!value)return undefined;const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('PUBLIC_SITE_ORIGIN inválida');return url.origin}
export function requestOrigin(req){const origin=configuredOrigin();return origin||`http://${req.headers.host}`}
export function hostedRequest(req){
 let origin;try{origin=configuredOrigin()}catch{return false}if(!origin)return false
 if(req.headers.host!==new URL(origin).host)return false
 if(req.headers.origin&&req.headers.origin!==origin)return false
 if(req.headers['sec-fetch-site']==='cross-site'&&!['GET','HEAD'].includes(req.method))return false
 return !['POST','PUT','PATCH','DELETE'].includes(req.method)||req.headers.origin===origin
}
