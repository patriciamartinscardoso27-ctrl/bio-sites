import fs from 'node:fs/promises'
import {createApi,createAdminPageGuard} from '../server/api.mjs'
import {createAppServer} from '../server/http-server.mjs'
import {isolatedRepository} from './publication-isolated-repository.mjs'
await fs.mkdir('artifacts/publication',{recursive:true})
const repository=await isolatedRepository('artifacts/publication/demo-state.json')
// Dedicated loopback server, disposable local JSON only. This is never the production auth adapter.
const getAuth=async()=>({session:async()=>({id:'LOCAL-ISOLATED-DEMO'})}),api=createApi({repository,getAuth}),server=createAppServer({api,pageGuard:createAdminPageGuard({getAuth})})
server.listen(5181,'127.0.0.1',()=>console.log('Demonstração isolada em http://localhost:5181/admin — somente JSON local, zero Neon.'))
