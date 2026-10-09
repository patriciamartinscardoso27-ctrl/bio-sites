import type {Action,Bio,VisualSettings} from '../types/biosite'
export type ButtonAppearanceMode='brand'|'theme'|'custom'
type BrandPresentation={background:string;fill?:string;ink:string;icon?:string;border:string;hover:string;shadow?:string}
// These are button presentations around licensed, unchanged brand glyphs.
// Google always keeps its supplied full-color asset, irrespective of button mode.
const presentations:Record<string,BrandPresentation>={
 whatsapp:{background:'#075e54',ink:'#ffffff',border:'#25d366',hover:'#128c7e'},
 instagram:{background:'#833ab4',fill:'linear-gradient(135deg,#833ab4,#b51f67,#b62c52)',ink:'#ffffff',border:'#c13584',hover:'#833ab4'},
 facebook:{background:'#0866ff',ink:'#ffffff',border:'#0866ff',hover:'#0754d6'},
 youtube:{background:'#cc0000',ink:'#ffffff',border:'#ff0000',hover:'#a30000'},
 tiktok:{background:'#111111',ink:'#ffffff',border:'#25f4ee',hover:'#25f4ee',shadow:'inset 0 -2px 0 #fe2c55'},
 linkedin:{background:'#0a66c2',ink:'#ffffff',border:'#0a66c2',hover:'#004182'},
 twitter:{background:'#0f1419',ink:'#ffffff',border:'#536471',hover:'#536471'},
 telegram:{background:'#006fa3',ink:'#ffffff',border:'#229ed9',hover:'#005b87'},
 pinterest:{background:'#bd081c',ink:'#ffffff',border:'#e60023',hover:'#990718'},
 spotify:{background:'#121212',ink:'#ffffff',icon:'#1db954',border:'#1db954',hover:'#1db954'},
 google:{background:'#ffffff',ink:'#1f1f1f',border:'#dadce0',hover:'#4285f4'},
 'google-reviews':{background:'#ffffff',ink:'#1f1f1f',border:'#dadce0',hover:'#4285f4'},
}
export function brandButtonId(action:Action){return action.icon||(action.kind==='reviews'?'google-reviews':action.kind)}
export function brandPresentation(action:Action){const id=brandButtonId(action);return id?presentations[id]:undefined}
export function buttonAppearanceMode(action:Action):ButtonAppearanceMode|undefined{return action.appearanceMode||(action.iconColorMode==='original'&&brandPresentation(action)?'brand':undefined)}
export const buttonVisualColors=['background','backgroundGradient','iconColor','text','textColor','border','hoverColor'] as const
export function clearButtonColors(visual?:VisualSettings):VisualSettings{const next={...visual,colorBindings:{...visual?.colorBindings}};for(const key of buttonVisualColors){delete next[key];if(key!=='backgroundGradient')delete next.colorBindings[key]}return next}
export function themeButtonBackground(bio:Bio){return bio.appearance?.buttonBackground||bio.appearance?.buttonDefault||bio.color}
