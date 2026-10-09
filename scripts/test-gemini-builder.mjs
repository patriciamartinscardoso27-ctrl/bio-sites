// One bounded real call; no Neon access, credentials or provider response logged.
import {createGeminiVisionProvider,createVisionService,loadGeminiKey} from '../server/vision-reference.mjs'
import {validateBio} from '../server/validation.mjs'
const {composeReference}=await import('../src/lib/referenceDesign.ts')
try{
 const provider=createGeminiVisionProvider({key:await loadGeminiKey()}),service=createVisionService({getProvider:async()=>provider})
 const {spec}=await service.analyze({categoryId:'barber',description:'Crie um BioSite premium para barbearia, preto com dourado, elegante, exatamente quatro botões grandes no topo: WhatsApp, Instagram, Agendar e Como chegar. Vitrine com seis serviços em grade 3 por 2 e seção Como chegar. Use somente dados demonstrativos editáveis.'},'automatic-builder-test')
 const bio=composeReference({name:'Teste automático de design',categoryId:'barber',goal:'bookings',style:'premium',theme:'any',density:'balanced'},'gemini-builder:0',spec)
 try{validateBio(bio)}catch{throw new Error('Validação local rejeitou o DNA visual.')}
 const services=bio.sections.find(s=>s.kind==='services'),count=services?.content?.items?.length??bio.services.length
 const actions=[...bio.actions,...bio.sections.flatMap(s=>s.content?.actions||[])];
 if(actions.length!==4||count!==6||services?.visual?.columns!==3&&services?.layout!=='three'||!bio.sections.some(s=>s.kind==='location'&&s.enabled))throw new Error('Composição: ações='+actions.length+', serviços='+count+', layout='+services?.layout+', colunas='+services?.visual?.columns)
 console.log(JSON.stringify({ok:true,editableContentValidated:true,actions:actions.length,services:count,layout:services.layout,location:true,neonWrites:0}))
}catch(error){console.error(JSON.stringify({ok:false,error:error.message==='Validação local rejeitou o DNA visual.'||error.message.startsWith('Composição:')||error.status?error.message:'O design recebido não passou na validação de composição.'}));process.exitCode=1}
