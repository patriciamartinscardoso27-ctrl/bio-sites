import {createHmac,timingSafeEqual} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {parseEnv} from 'node:util'
function key(){let value=process.env.TEMPLATE_ASSET_SIGNING_KEY;if(!value&&!process.env.VERCEL)try{value=parseEnv(readFileSync(new URL('../.env.server.local',import.meta.url),'utf8')).TEMPLATE_ASSET_SIGNING_KEY}catch{}if(!value||value.length<43)throw Error('Armazenamento de templates: chave de integridade não configurada.');return value}
export function signTemplateAssets(digest){return createHmac('sha256',key()).update('biosite-template-assets-v1:'+digest).digest('hex')}
export function verifyTemplateAssets(pack){if(!/^[a-f0-9]{64}$/.test(pack.storageProof||''))return false;const expected=signTemplateAssets(pack.digest);return timingSafeEqual(Buffer.from(expected),Buffer.from(pack.storageProof))}
