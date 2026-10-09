import type {Action} from '../types/biosite'
import {clearButtonColors} from './brandButtonAppearance'
export const brandIconIds=['whatsapp','instagram','facebook','tiktok','youtube','linkedin','twitter','telegram','pinterest','spotify','google','google-reviews'] as const
export function isBrandIcon(id?:string){return brandIconIds.some(brand=>brand===id)}
export function selectIconPatch(action:Action,icon:Action['icon']):Partial<Action>{const brand=isBrandIcon(icon),mode=brand?'original':action.iconColorMode||'theme';return {icon,iconColorMode:mode,appearanceMode:brand?'brand':action.appearanceMode,visual:brand?clearButtonColors(action.visual):{...action.visual,iconColor:mode==='custom'?action.visual?.iconColor:undefined,colorBindings:{...action.visual?.colorBindings,iconColor:undefined}}}}
