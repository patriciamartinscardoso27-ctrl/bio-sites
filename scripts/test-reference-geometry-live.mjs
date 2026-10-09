// A single real layout-reference request. No Neon writes or raw provider output.
import {readFile} from 'node:fs/promises'
import {createGeminiVisionProvider,createVisionService,loadGeminiKey} from '../server/vision-reference.mjs'
import {validateBio} from '../server/validation.mjs'
const {composeReference}=await import('../src/lib/referenceDesign.ts')
try{
 const path=process.argv[2];if(!path)throw Error('Informe o caminho de uma referência de teste.')
 const bytes=await readFile(path),provider=createGeminiVisionProvider({key:await loadGeminiKey()}),service=createVisionService({getProvider:async()=>provider})
 const {spec}=await service.analyze({creationMode:'reproduce',categoryId:'fashion',images:[{mime:'image/png',data:bytes.toString('base64'),role:'reference',name:'Referência de layout para teste'}],description:'Reconstrua a composição completa dos exemplos mobile em uma única página, seguindo a referência: Hero fotográfico com logo, quatro ações compactas, coleções, banners, produtos, benefícios, galeria, Sobre, horários e localização. Ignore o painel administrativo que aparece abaixo. Use conteúdo demonstrativo coerente para loja de roupas, sem copiar o nome/marca ou os textos da referência.'},'layout-reference-live-test')
 const bio=composeReference({name:'Teste de referência',categoryId:'fashion',goal:'products',style:'modern',theme:'any',density:'balanced'},'reference-live',spec);validateBio(bio)
 const kinds=bio.sections.map(s=>s.kind),required=['actions','categories','promotion','products','benefits','gallery','about','hours','location']
 console.log(JSON.stringify({stage:'generated-inventory',sections:kinds}));
 if(!required.every(kind=>kinds.includes(kind))||kinds.length<9)throw Error('A referência complexa ainda perdeu blocos importantes.')
 const top=bio.sections.find(s=>s.kind==='actions');if(top.content.actions.length!==4)throw Error('As quatro ações da referência não foram preservadas.')
 console.log(JSON.stringify({ok:true,sections:kinds,observed:spec.referenceComposition.sections.length,validation:spec.compositionValidation,editableContentValidated:true,neonWrites:0}))
}catch(error){console.error(JSON.stringify({ok:false,error:error.status?error.message:['A referência complexa ainda perdeu blocos importantes.','As quatro ações da referência não foram preservadas.'].includes(error.message)?error.message:'A referência não passou na validação técnica.'}));process.exitCode=1}
