import {PalettePanel} from './PaletteTools'
import type { Bio, Appearance } from '../types/biosite'
import { appearancePreset, layoutNames, sectionLayouts,defaultAppearance } from '../lib/visualDesign'
import { labels } from '../data/templates'
import { VisualColor,VisualAppearancePanel } from './VisualAppearancePanel'
import { ButtonThemePanel } from './ButtonThemePanel'
import { SectionControls } from './SectionControls'
import {restoreGeneratedDesign} from '../lib/designCompositionEngine'
export function DesignPanel({bio,onChange}:{bio:Bio;onChange:(p:Partial<Bio>)=>void}){
 const a=defaultAppearance(bio),patch=(p:Partial<Appearance>)=>onChange({appearance:{...a,...p}})
 const presets=['Original','Premium','Elegante','Minimalista','Claro','Escuro','Vibrante']
 return <><PalettePanel bio={bio} onChange={onChange}/>{bio.composition&&<button className="studio-secondary" onClick={()=>onChange(restoreGeneratedDesign(bio))}>Restaurar design gerado</button>}<div className="studio-preset-grid">{presets.map(p=>{const candidate={...bio,...appearancePreset(bio,p)},ap=candidate.appearance;return <button key={p} onClick={()=>onChange(appearancePreset(bio,p))}><span className="studio-palette-sample">{[candidate.color,ap?.background||'#101719',ap?.panel||'#ffffff',ap?.text||'#f7f6f0',ap?.highlight||candidate.color].map((color,i)=><span key={i} style={{background:color}}/>)}</span>{p}</button>})}</div><VisualColor label="Bordas" brand={bio.color} value={a.border||'#43514e'} onChange={border=>patch({border})}/><label>Tipografia<select value={a.font} onChange={e=>patch({font:e.target.value as Appearance['font']})}><option value="sans">Moderna</option><option value="serif">Clássica</option><option value="condensed">Marcante</option></select></label>{bio.renderMode==='flexible'&&<details><summary>DNA visual · proporções gerais</summary><VisualAppearancePanel bio={bio} value={bio.designVisual} onChange={designVisual=>onChange({designVisual})} onRestore={()=>onChange({designVisual:bio.composition?.initialVisual.designVisual})}/></details>}<ButtonThemePanel bio={bio} onChange={onChange}/><button className="studio-secondary" onClick={()=>onChange(appearancePreset(bio,'Original'))}>Restaurar design original do modelo</button></>
}
export function SectionsPanel({bio,onChange,onEdit}:{bio:Bio;onChange:(p:Partial<Bio>)=>void;onEdit:(id:string)=>void}){
 return <div className="studio-section-manager"><button className="studio-secondary" onClick={()=>onEdit('hero')}>Editar capa e composição do hero</button><label className="studio-checkbox"><input type="checkbox" checked={bio.heroEnabled!==false} onChange={e=>onChange({heroEnabled:e.target.checked})}/> Mostrar capa e identidade</label><small>A identidade é uma parte estrutural. Você pode ocultá-la sem apagar nome, logo ou capa.</small>{bio.sections.map(s=><div key={s.id} className="studio-managed-section"><button className="studio-section-name" onClick={()=>onEdit(s.id)}><strong>✏️ {s.title||labels[s.kind]}</strong><small>{labels[s.kind]} · {s.enabled?'Visível':'Oculta · dados preservados'}</small></button><SectionControls bio={bio} section={s} onChange={onChange} compact/></div>)}</div>
}
export function LayoutPicker({kind,value,onChange}:{kind:keyof typeof sectionLayouts;value?:string;onChange:(v:string|undefined)=>void}){
 const options=sectionLayouts[kind];if(!options)return null
 return <fieldset className="studio-layout-picker"><legend>Layout desta seção</legend><button aria-pressed={!value} onClick={()=>onChange(undefined)}>Original do modelo</button>{options.map(v=><button key={v} aria-pressed={value===v} onClick={()=>onChange(v)}><span className={'layout-swatch layout-'+v}>▰ ▰</span>{layoutNames[v]}</button>)}</fieldset>
}
