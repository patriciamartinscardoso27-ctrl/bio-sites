import type {VisualSettings} from '../types/biosite'
export const visualNumberBounds={cardPaddingX:100,cardPaddingY:100,cardGap:80,cardTitleSize:60,cardBodySize:36,priceSize:48,headingGap:80,contentWidth:100,surfaceRadius:80,surfaceBorderWidth:12,imagePositionX:100,imagePositionY:100,bodySize:36,lineHeight:240,letterSpacing:20,fontWeight:900,mediaAspect:1000,heightPercent:600,widthPercent:100,paddingX:100,paddingY:160,gap:80,minHeight:900,mediaHeight:900,iconSize:96,borderWidth:12,columns:4,radiusPx:80,maxWidth:1200,mediaWidth:100,fontSize:60,logoSize:160,glyphSize:64,buttonHeight:220,labelSize:28,subtitleSize:22,overlay:95} as const
export const visualEnumValues={cardSurface:['plain','panel'],surfaceShadow:['none','soft','strong'],textStyle:['normal','italic'],radius:['square','rounded','pill'],shadow:['none','soft','strong'],spacing:['compact','normal','wide'],titleSize:['small','medium','large'],align:['left','center','right'],font:['sans','serif','condensed'],weight:['regular','bold'],imageFit:['cover','contain'],imagePosition:['center','top','bottom'],style:['solid','outline','soft'],borderStyle:['solid','dashed','dotted'],heroComposition:['cover','stacked','split','profile','overlap'],contentPosition:['top','center','bottom'],actionFormat:['tiles','cards','rows','icons'],iconPosition:['top','left'],cardMedia:['top','left','background'],mediaPlacement:['top','bottom','left','right','background']} as const
export const visualColorKeys=['surfaceText','background','text','titleColor','iconColor','textColor','hoverColor','highlight','panel','border'] as const
// Only explicit linear color gradients are accepted: no URLs, CSS variables or code.
export function normalizeGradient(input:unknown):string|undefined{
 if(typeof input!=='string'||input.length>240)return undefined
 const match=/^linear-gradient\(\s*(-?\d{1,3})deg\s*,(.+)\)$/i.exec(input)
 if(!match||Math.abs(Number(match[1]))>360)return undefined
 const stops=match[2].split(',');if(stops.length<2||stops.length>6)return undefined
 const valid=stops.map(stop=>/^\s*(#[0-9a-f]{6})(?:\s+(\d{1,3})%)?\s*$/i.exec(stop))
 if(valid.some(stop=>!stop||(stop[2]!==undefined&&Number(stop[2])>100)))return undefined
 return `linear-gradient(${Number(match[1])}deg, ${valid.map(stop=>stop![1].toLowerCase()+(stop![2]!==undefined?' '+Number(stop![2])+'%':'')).join(', ')})`
}
export function normalizeVisualSpec(input:unknown):VisualSettings{
 if(Array.isArray(input))input=Object.fromEntries(input.slice(0,80).filter(v=>v&&typeof v.key==='string'&&typeof v.value==='string').map(v=>[v.key,v.key in visualNumberBounds?Number(v.value):v.value]))
 if(!input||typeof input!=='object'||Array.isArray(input))return {}
 const source=input as Record<string,unknown>,result:Record<string,unknown>={}
 const overlay=normalizeGradient(source.overlayGradient);if(overlay)result.overlayGradient=overlay;
 const gradient=normalizeGradient(source.backgroundGradient);if(gradient)result.backgroundGradient=gradient
 for(const key of visualColorKeys)if(typeof source[key]==='string'&&/^#[0-9a-f]{6}$/i.test(source[key] as string))result[key]=(source[key] as string).toLowerCase()
 for(const [key,max] of Object.entries(visualNumberBounds))if(Number.isInteger(source[key])&&Number(source[key])>=(key==='columns'?1:0)&&Number(source[key])<=max)result[key]=source[key]
 for(const [key,values] of Object.entries(visualEnumValues))if((values as readonly unknown[]).includes(source[key]))result[key]=source[key]
 return result as VisualSettings
}
