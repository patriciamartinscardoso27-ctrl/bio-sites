import type {ReferenceBlock,ReferenceDesignSpec} from './referenceDesign'
import type {Bio,VisualSettings} from '../types/biosite'
import {normalizeVisualSpec} from './visualSpec'
import {sectionContent} from './sections'
export interface ReferenceGeometry {bounds?:{width:number;height:number};viewportWidth?:number;canvasAspect?:number;heightPercent:number;widthPercent:number;mediaPercent:number;mediaAspect?:number;mediaKind?:'photo'|'icon'|'none';mediaPlacement?:VisualSettings['mediaPlacement'];cardMedia?:VisualSettings['cardMedia'];columns?:number;background?:string;text?:string;surface:'light'|'dark';density:'compact'|'balanced'|'dense'}
export interface ReferenceObservation extends ReferenceBlock {required?:boolean;role?:'section'|'banner'|'feature'|'footer-social'|'footer-identity';geometry:ReferenceGeometry}
export interface ReferenceComposition {heroVisual?:VisualSettings;heroGeometry?:ReferenceGeometry;segmentation?:{mode:'single_page'|'sequential_segments'|'alternatives'|'uncertain';segments:{start:number;end:number}[]};sections:ReferenceObservation[]}
export function surface(hex?:string){if(!hex||!/^#[0-9a-f]{6}$/i.test(hex))return undefined;return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)<128?'dark':'light'}
export function geometryVisual(block:ReferenceObservation):VisualSettings{
 const g=block.geometry,v={...block.visual,...(g.mediaPlacement?{mediaPlacement:g.mediaPlacement}:{}),...(g.cardMedia?{cardMedia:g.cardMedia}:{})}
 return {surfaceRadius:0,surfaceBorderWidth:0,surfaceShadow:'none',...(v.mediaPlacement==='left'||v.mediaPlacement==='right'||v.cardMedia==='left'?{mediaWidth:g.mediaPercent}:{}),paddingY:g.density==='compact'?10:g.density==='dense'?14:24,...v,...(g.columns?{columns:g.columns as 1|2|3|4}:{}),...(g.background?{background:g.background,panel:v.panel||g.background}:{}),...(g.text?{surfaceText:g.text,text:v.text||g.text}:{}),...(g.mediaKind&&g.mediaKind!=='photo'?{mediaAspect:undefined}:g.mediaAspect?{mediaAspect:g.mediaAspect}:{}),heightPercent:g.heightPercent,widthPercent:g.widthPercent,minHeight:undefined}
}
export function compositionFidelity(observed:ReferenceComposition,blocks:ReferenceBlock[],page?:string){
 let cursor=0;const expected=observed.sections.filter(a=>{if(a.required===false&&blocks[cursor]?.kind!==a.kind)return false;cursor++;return true}),n=Math.max(expected.length,blocks.length,1),dp=Array.from({length:expected.length+1},()=>Array(blocks.length+1).fill(0)),differences:string[]=[]
 for(let i=1;i<=expected.length;i++)for(let j=1;j<=blocks.length;j++)dp[i][j]=expected[i-1].kind===blocks[j-1].kind?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1])
 let counts=0,columns=0,proportions=0,colors=0,finish=0,media=0
 expected.forEach((a,i)=>{const b=blocks[i],v=b?.visual||{},want=geometryVisual(a),required=a.required!==false,fail=(reason:string)=>{if(required)differences.push(`${i}:${a.role||a.kind}:${reason}`)}
  if(!b||b.kind!==a.kind){fail('missing-or-out-of-order');return}
  if(a.count===undefined||a.count===b.count)counts++;else fail(`items expected ${a.count}, actual ${b.count??0}`)
  if((v.columns||1)===(want.columns||1))columns++;else fail(`columns expected ${want.columns||1}, actual ${v.columns||1}`)
  const proportion=Math.abs((v.heightPercent||0)-a.geometry.heightPercent)<=Math.max(5,a.geometry.heightPercent*.2)&&Math.abs((v.widthPercent??100)-a.geometry.widthPercent)<=10
  if(proportion)proportions++;else fail('proportions')
  if(a.layout&&a.layout!==b.layout)fail('layout')
  for(const key of ['cardPaddingX','cardPaddingY','cardGap','cardTitleSize','cardBodySize','priceSize','headingGap','contentWidth','overlayGradient','cardSurface','paddingX','paddingY','gap','mediaAspect','mediaWidth','radiusPx','borderWidth','shadow','align','imageFit','imagePositionX','imagePositionY','overlay','font','fontSize','bodySize','lineHeight','weight','fontWeight','iconSize','glyphSize','labelSize','subtitleSize'] as const)if(want[key]!==undefined&&v[key]!==want[key])fail('visual:'+key)
  const bg=v.background||page;if(surface(bg)===a.geometry.surface&&(!want.background||bg?.toLowerCase()===want.background.toLowerCase()))colors++;else fail('background/surface')
  if(Math.abs((v.paddingY??24)-(want.paddingY??24))<=8&&(!want.font||v.font===want.font)&&(!want.fontSize||v.fontSize===want.fontSize))finish++
  if((!want.mediaPlacement||want.mediaPlacement===v.mediaPlacement)&&(!want.cardMedia||want.cardMedia===v.cardMedia))media++;else fail('image-placement')
 })
 const d=Math.max(expected.length,1),order=dp[expected.length][blocks.length]/n,number=Math.min(expected.length,blocks.length)/n
 const metrics={structure:(order+number+counts/d)/3,geometry:(columns/d+proportions/d+media/d)/3,colors:colors/d,finish:finish/d,photos:media/d}
 const score=Math.round(100*(metrics.structure*.40+metrics.geometry*.25+metrics.colors*.20+metrics.finish*.10+metrics.photos*.05))
 return {score,metrics,differences,approved:differences.length===0&&score>=85}
}
export function validateReferenceBio(observed:ReferenceComposition,bio:Bio){
 const blocks:ReferenceBlock[]=bio.sections.filter(s=>s.enabled).map(s=>{const c=sectionContent(bio,s);const count=s.kind==='actions'?c.actions?.filter(a=>a.enabled!==false).length:s.kind==='products'||s.kind==='services'||s.block==='cards'?c.items?.length:s.kind==='categories'?c.highlights?.length:s.kind==='gallery'?c.photos?.length:s.kind==='benefits'?c.benefits?.length:s.kind==='testimonials'?s.text.split('\n').filter(Boolean).length:1;return {kind:s.kind,count,layout:s.layout,visual:s.visual}})
 const report=compositionFidelity(observed,blocks,bio.designVisual?.background||bio.appearance?.background)
 observed.sections.forEach((a,i)=>{if(a.required===false)return;const s=bio.sections.filter(s=>s.enabled)[i];if(!s)return;const c=sectionContent(bio,s)
  if(a.mediaRole&&a.mediaRole!=='none'){const slots=s.kind==='gallery'?c.photos?.length:s.kind==='categories'?c.highlights?.length:s.kind==='products'||s.kind==='services'||s.block==='cards'?c.items?.length:s.image||s.visual?.mediaAspect?1:0;if(!slots)report.differences.push(`${i}:${a.kind}:image-slot`)}
 })
 if(observed.heroVisual?.mediaAspect&&!bio.cover&&!bio.heroVisual?.mediaAspect)report.differences.push('hero:image-slot')
 report.approved=report.differences.length===0&&report.score>=85;return report
}
export function enforceReferenceComposition(spec:ReferenceDesignSpec):ReferenceDesignSpec{
 const observed=spec.referenceComposition;if(!observed?.sections.length)return spec
 const before=compositionFidelity(observed,spec.blocks||[],spec.palette.background),remaining=[...(spec.blocks||[])]
 const corrected=observed.sections.map(source=>{const index=remaining.findIndex(block=>block.kind===source.kind),content=index>=0?remaining.splice(index,1)[0]:undefined;return {...content,...source,mediaIndices:source.mediaIndices||content?.mediaIndices,visual:geometryVisual(source),title:content?.title??source.title,text:content?.text??source.text}})
 const after=compositionFidelity(observed,corrected,spec.palette.background)
 return {...spec,blocks:corrected,heroVisual:{...spec.heroVisual,...observed.heroVisual,...(observed.heroGeometry?{heightPercent:observed.heroGeometry.heightPercent,widthPercent:observed.heroGeometry.widthPercent,minHeight:undefined,...(observed.heroGeometry.mediaKind==='photo'&&observed.heroGeometry.mediaPlacement==='background'?{heroComposition:'cover' as const,mediaAspect:observed.heroGeometry.mediaAspect}: {})}: {})},sectionOrder:corrected.map(b=>b.kind),sections:[...new Set(corrected.map(b=>b.kind))],compositionValidation:{before:spec.compositionValidation?.before??before.score,after:after.score,corrected:spec.compositionValidation?.corrected||before.score!==after.score}}
}
export function normalizeReferenceGeometry(value:unknown):ReferenceGeometry|undefined{
 if(!value||typeof value!=='object')return undefined;const g={...value} as Record<string,unknown>
 const bounds=g.bounds as {width?:number;height?:number}|undefined,viewport=Number(g.viewportWidth),aspect=Number(g.canvasAspect)
 if(bounds&&Number.isInteger(bounds.width)&&Number.isInteger(bounds.height)&&Number(bounds.width)>0&&Number(bounds.width)<=1000&&Number(bounds.height)>0&&Number(bounds.height)<=1000&&viewport>0&&viewport<=1000){g.heightPercent=Math.round(Number(bounds.height)/viewport*100);g.widthPercent=Math.min(100,Math.round(Number(bounds.width)/viewport*100))}
 if(g.columns!==undefined&&(!Number.isInteger(g.columns)||Number(g.columns)<1||Number(g.columns)>4))return undefined;
 if(g.background!==undefined&&(typeof g.background!=='string'||!/^#[0-9a-f]{6}$/i.test(g.background)))return undefined;
 if(!['light','dark'].includes(String(g.surface))||!['compact','balanced','dense'].includes(String(g.density)))return undefined
 for(const [key,min,max] of [['heightPercent',5,600],['widthPercent',10,100],['mediaPercent',0,100]] as const)if(!Number.isInteger(g[key])||Number(g[key])<min||Number(g[key])>max)return undefined
 return {...(bounds&&viewport?{bounds:{width:Number(bounds.width),height:Number(bounds.height)},viewportWidth:viewport,canvasAspect:aspect}:{}),...(['photo','icon','none'].includes(String(g.mediaKind))?{mediaKind:g.mediaKind as ReferenceGeometry['mediaKind']}:{}),...(['top','bottom','left','right','background'].includes(String(g.mediaPlacement))?{mediaPlacement:g.mediaPlacement as ReferenceGeometry['mediaPlacement']}:{}),...(['top','left','background'].includes(String(g.cardMedia))?{cardMedia:g.cardMedia as ReferenceGeometry['cardMedia']}:{}),...(Number.isInteger(g.columns)&&Number(g.columns)>=1&&Number(g.columns)<=4?{columns:Number(g.columns)}:{}),...(typeof g.background==='string'&&/^#[0-9a-f]{6}$/i.test(g.background)?{background:g.background.toLowerCase()}:{}),...(typeof g.text==='string'&&/^#[0-9a-f]{6}$/i.test(g.text)?{text:g.text.toLowerCase()}:{}),...(Number.isInteger(g.mediaAspect)&&Number(g.mediaAspect)>0&&Number(g.mediaAspect)<=1000?{mediaAspect:Number(g.mediaAspect)}:{}),heightPercent:Number(g.heightPercent),widthPercent:Number(g.widthPercent),mediaPercent:Number(g.mediaPercent),surface:(typeof g.background==='string'&&surface(g.background)||g.surface) as ReferenceGeometry['surface'],density:g.density as ReferenceGeometry['density']}
}
export const geometrySchema={type:'object',additionalProperties:false,properties:{bounds:{type:'object',additionalProperties:false,properties:{width:{type:'integer',minimum:1,maximum:1000},height:{type:'integer',minimum:1,maximum:1000}},required:['width','height']},viewportWidth:{type:'integer',minimum:1,maximum:1000},canvasAspect:{type:'integer',minimum:1,maximum:10000},mediaKind:{type:'string',enum:['photo','icon','none']},mediaPlacement:{type:'string',enum:['top','bottom','left','right','background']},cardMedia:{type:'string',enum:['top','left','background']},columns:{type:'integer',minimum:1,maximum:4},background:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},text:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'},mediaAspect:{type:'integer',minimum:1,maximum:1000},heightPercent:{type:'integer',minimum:5,maximum:600},widthPercent:{type:'integer',minimum:10,maximum:100},mediaPercent:{type:'integer',minimum:0,maximum:100},surface:{type:'string',enum:['light','dark']},density:{type:'string',enum:['compact','balanced','dense']}},required:['heightPercent','widthPercent','mediaPercent','surface','density']}
export function normalizeObservedVisual(input:unknown){return normalizeVisualSpec(input)}

// Resolve ambiguous photographic block classifications using full-page context
// and independent panel observations between matching non-photographic anchors.
export function reconcilePanelKinds(global:ReferenceObservation[],panels:ReferenceObservation[]){
 const ambiguous=(s:ReferenceObservation)=>['about','promotion'].includes(s.kind)&&s.role!=='footer-identity',group=(list:ReferenceObservation[])=>{let anchor='';const groups=new Map<string,ReferenceObservation[]>();for(const s of list){if(!ambiguous(s)){anchor+='|'+s.kind;continue}groups.set(anchor,[...(groups.get(anchor)||[]),s])}return groups},full=group(global),local=group(panels);const replacements=new Map<ReferenceObservation,ReferenceObservation>();for(const [anchor,entries]of local){const contextual=full.get(anchor);if(contextual?.length===entries.length)entries.forEach((s,i)=>replacements.set(s,{...s,kind:contextual[i].kind,role:contextual[i].role}))}return panels.map(s=>replacements.get(s)||s)
}

export function validateReferenceRender(contract:ReferenceComposition,rows:(ReferenceBlock&{images?:number})[],page?:string){const report=compositionFidelity(contract,rows,page);contract.sections.forEach((s,i)=>{if(s.required!==false&&s.mediaRole&&s.mediaRole!=='none'&&!rows[i]?.images)report.differences.push(i+':'+s.kind+':rendered-image-slot')});report.approved=report.differences.length===0&&report.score>=85;return report}

// Panel crops refine measurements without discarding visual details from the full-page analysis.
export function mergePanelVisuals(global:ReferenceObservation[],panels:ReferenceObservation[],segments?:{start:number;end:number}[]){
 const pools=new Map<string,{source:ReferenceObservation;index:number}[]>();global.forEach((source,index)=>{const key=source.kind+'|'+(source.role||'section');pools.set(key,[...(pools.get(key)||[]),{source,index}])});
 const used=new Set<number>(),rows=panels.map(s=>{const key=s.kind+'|'+(s.role||'section'),match=pools.get(key)?.shift();if(match)used.add(match.index);const full=match?.source;return {index:match?.index??-1,section:full?{...full,...s,visual:{...full.visual,...s.visual},titleVisual:{...full.titleVisual,...s.titleVisual},geometry:{...full.geometry,...s.geometry}}:s}});
 global.forEach((source,index)=>{if(used.has(index)||source.required===false)return;let at=rows.findIndex(row=>row.index>index);if(at<0)at=rows.length;rows.splice(at,0,{index,section:structuredClone(source)});if(segments){const owner=segments.findIndex(segment=>at<=segment.end);segments.forEach((segment,i)=>{if(owner<0){if(i===segments.length-1)segment.end++}else if(i===owner)segment.end++;else if(i>owner){segment.start++;segment.end++}})}});
 return rows.map(row=>row.section)
}
