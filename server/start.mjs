import { createAppServer } from './http-server.mjs'
const server=createAppServer()
server.listen(3000,'127.0.0.1',()=>console.log('Admin local: http://127.0.0.1:3000. Login e publicação pública não habilitados.'))
server.on('error',()=>{console.error('Não foi possível iniciar o servidor local.');process.exitCode=1})
