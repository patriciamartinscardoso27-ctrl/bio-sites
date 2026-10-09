import type {CSSProperties,ReactNode} from 'react'
import type {TextOptions,VisualSettings} from '../types/biosite'
import {visualStyles} from '../lib/visualStyles'
export function EditableText({owner,field,value,as:Tag='p',style,fallbackVisual,children,richValue}:{owner:{textOptions?:Partial<Record<string,TextOptions>>};field:string;value?:string;as?:'p'|'h2'|'h3'|'strong'|'small'|'span';style?:CSSProperties;fallbackVisual?:VisualSettings;children?:ReactNode;richValue?:ReactNode}){
 const option=owner.textOptions?.[field]
 if(option?.hidden||!value?.trim())return null
 return <Tag data-editable-text={field} data-custom-text-color={option?.visual?.text?true:undefined} style={{'--editable-text-color':option?.visual?.text,...style,...visualStyles(fallbackVisual),...visualStyles(option?.visual)} as CSSProperties}>{children}{richValue??value}</Tag>
}
