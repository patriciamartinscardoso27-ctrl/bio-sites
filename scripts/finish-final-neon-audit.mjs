import fs from 'node:fs/promises'
const path='artifacts/functional-audit/neon-write-plan.json',plan=JSON.parse(await fs.readFile(path,'utf8'))
Object.assign(plan,{status:'COMPLETED',remoteWritesExecuted:true,result:'neon-real-result.json',successfulDraftUpdates:4,newRevisionsCreated:7,newSitesCreated:3})
await fs.writeFile(path,JSON.stringify(plan,null,2))
const reportPath='artifacts/functional-audit/report.md'
let report=await fs.readFile(reportPath,'utf8')
report=report.replace('# Auditoria funcional final — Bio Sites','# Auditoria funcional final — Bio Sites\n\n**Atualização após autorização:** o teste real de persistência foi concluído com três novos rascunhos e sete novas revisões. Os 11 BioSites e as 262 revisões anteriores permaneceram intactos. Consulte [resultado real no Neon](./neon-real-report.md). O relatório abaixo registra a auditoria anterior à autorização.')
await fs.writeFile(reportPath,report)
const dashboard='artifacts/functional-audit/index.html'
let html=await fs.readFile(dashboard,'utf8')
html=html.replace('Novas escritas de teste no Neon aguardam autorização.','Persistência real aprovada no escopo autorizado; publicação e rotas públicas seguem pendentes.').replace('<strong>0</strong>Escritas remotas nesta auditoria','<strong>3</strong>Rascunhos TESTE AUDITORIA criados').replace('Novo salvamento, criação e duplicação remotos ainda não testados.','Teste real concluído: criação, edição, salvamento, fechamento, reabertura e duplicação. Total final: 14 BioSites e 269 revisões; os 11 BioSites e 262 revisões originais permanecem intactos.').replace('Plano para aprovação','Teste real concluído').replace('Criar somente três rascunhos identificados de teste: Xavier, Essenza e cópia Xavier. Não publicar nem editar clientes existentes. Os três registros permanecerão no Neon.','Três rascunhos TESTE AUDITORIA: Xavier, Essenza e cópia Xavier. Cada um mantém suas próprias alterações. Todos não publicados e mantidos no Neon. Nenhum cliente anterior foi alterado.').replace('<a href="neon-write-plan.md">Plano seguro de escrita</a>','<a href="neon-real-report.md">Resultado e IDs dos três rascunhos</a>')
await fs.writeFile(dashboard,html)
console.log('Artefatos atualizados; teste encerrado para novas escritas. Nenhuma operação remota executada por este script.')
