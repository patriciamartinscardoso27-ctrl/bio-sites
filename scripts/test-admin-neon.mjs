// Repository integration test only. Explicit test BioSites; no account or schema changes.
import {readFile,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import {connectRepository} from '../server/repository.mjs'
const {templates,createBio}=await import('../src/data/templates.ts')
const {duplicateDraft,prepareSmartDraft}=await import('../src/lib/adminDrafts.ts')
const {duplicateSection,setSectionContent,sectionContent,removeSection}=await import('../src/lib/sections.ts')
const reportUrl=new URL('../review/admin-neon-tests.json',import.meta.url)
let stage='connect'
try{
  const repo=await connectRepository()
  let ids;try{ids=JSON.parse(await readFile(reportUrl,'utf8')).ids}catch{ids=[crypto.randomUUID(),crypto.randomUUID()];await writeFile(reportUrl,JSON.stringify({ids,complete:false}))}
  const getOrCreate=async(index)=>{
    try{const existing=await repo.get(ids[index]);assert(existing.content.name.startsWith('[Teste automático] Admin visual'));return existing}catch(e){if(e.status!==404)throw e}
    const content=prepareSmartDraft(createBio(templates[3]),'bookings');content.id=ids[index];content.name='[Teste automático] Admin visual '+(index?'B':'A');content.client={city:'Cidade de teste',responsible:'Fixture',notes:'Interna - fixture'}
    return repo.create(content)
  }
  stage='create/read';const first=await getOrCreate(0),second=await getOrCreate(1)
  let snapshot=prepareSmartDraft(createBio(templates[3]),'bookings');snapshot.id=first.id;snapshot.name=first.content.name;snapshot.client=structuredClone(first.content.client);snapshot.description='Teste de autosave e reabertura';snapshot.client.notes='Dados do cliente preservados em JSONB';snapshot.services[0].price='R$ 49,00'
  snapshot.heroLayout='compact';snapshot.sections.find(s=>s.kind==='services').layout='carousel';snapshot.appearance={theme:'dark',secondary:'#354039',font:'serif',buttons:'rounded',cards:'rounded',background:'#101719',panel:'#1c2629',text:'#f7f6f0',muted:'#bdc8c4',highlight:'#c9a66b',border:'#43514e'};snapshot.actions[0].subtitle='Agende agora';snapshot.actions[0].icon='calendar';
  snapshot.appearance.buttonMode='theme';snapshot.appearance.buttonBackground='#163422';snapshot.appearance.buttonIcon='#ffffff';snapshot.appearance.buttonText='#ffffff';snapshot.actions[0].visual={background:'#089848',iconColor:'#ffffff',textColor:'#fff000',border:'#ffffff',radius:'pill',style:'solid'};const service=snapshot.sections.find(s=>s.kind==='services'),cloned=duplicateSection(snapshot,service.id);snapshot.sections=cloned.sections;Object.assign(snapshot,setSectionContent(snapshot,cloned.copy,{items:cloned.copy.content.items.map((i,n)=>n===0?{...i,title:'Serviço independente',visual:{background:'#223344'}}:i)}));snapshot.actions[0].destination='section';snapshot.actions[0].sectionId=cloned.copy.id;snapshot.sections=snapshot.sections.toReversed();
  snapshot=JSON.parse(JSON.stringify(snapshot));stage='update';const updated=await repo.save(first.id,snapshot,first.lockVersion)
  stage='reopen';const reopened=await (await connectRepository()).get(first.id)
  assert.deepEqual(reopened.content,snapshot);assert.equal(reopened.slug,first.slug)
  stage='isolation';const independent=await repo.get(second.id);assert.deepEqual(independent.content,second.content)
  stage='concurrency';await assert.rejects(repo.save(first.id,snapshot,first.lockVersion),e=>e.status===409)
  stage='duplicate';const copy=duplicateDraft(reopened.content);assert.notEqual(copy.id,reopened.id);copy.services[0].price='Outro preço';copy.client.notes='Outra observação';assert.notEqual(copy.services[0].price,reopened.content.services[0].price)
  // Reuse fixture B as the duplicate destination instead of accumulating test sites.
  copy.id=second.id;copy.name='[Teste automático] Admin visual B';const duplicated=await repo.save(second.id,copy,second.lockVersion)
  assert.notEqual(duplicated.slug,updated.slug);assert.deepEqual((await repo.get(second.id)).content,copy)
  stage='hide/restore/remove';const copySection=copy.sections.find(s=>s.id===cloned.copy.id);assert(copySection);const contents=structuredClone(sectionContent(copy,copySection));copySection.enabled=false;let saved=await repo.save(second.id,copy,duplicated.lockVersion);let read=await repo.get(second.id);assert.equal(read.content.sections.find(s=>s.id===copySection.id).enabled,false);assert.deepEqual(sectionContent(read.content,read.content.sections.find(s=>s.id===copySection.id)),contents);copySection.enabled=true;saved=await repo.save(second.id,copy,saved.lockVersion);const removed=JSON.parse(JSON.stringify({...copy,...removeSection(copy,copySection.id)}));saved=await repo.save(second.id,removed,saved.lockVersion);read=await (await connectRepository()).get(second.id);assert(!read.content.sections.some(s=>s.id===copySection.id));assert.equal(read.content.actions[0].sectionId,undefined);assert.deepEqual((await repo.get(first.id)).content,snapshot);
  stage='customer list';const list=await repo.list();const summary=list.items.find(s=>s.id===first.id);assert.equal(summary.city,snapshot.client.city);assert.equal(summary.templateId,templates[3].id);assert(!JSON.stringify(summary).includes(snapshot.client.notes))
  await writeFile(reportUrl,JSON.stringify({complete:true,ids,checks:['create','read','update','reopen','immutable slug','independence','stale write rejected','duplicate payload persisted independently','customer summary privacy','visual design and layouts round trip','global and individual button colors persisted','internal navigation survives reorder','duplicated section owns independent content','hide preserves content; restore and removal persisted','linked action detached on removal'],fixturesRetained:true,schemaUnchanged:true,authAccountUnchanged:true},null,2))
  console.log('PASS: real Neon create/read/update/reopen, client metadata, isolation and concurrency. Only two labeled test BioSites; no schema/account changes.')
}catch{console.error('FAIL: Admin Neon integration at '+stage+'; private details omitted.');process.exitCode=1}
