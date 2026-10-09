import {useContext} from 'react'
import {PaletteContext} from './PaletteTools'
import {extractImageColors,mergeColors} from '../lib/identityPalette'
import {useState} from 'react'
import {ImageCropDialog} from './ImageCropDialog'
import {cropSource} from '../lib/cropSource'
export function ImageField({label,value,onChange,aspect}:{aspect?:number;label:string;value:string;onChange:(value:string)=>void}){
 const [file,setFile]=useState<File|null>(null),context=useContext(PaletteContext),[error,setError]=useState('')
 return <div className="image-field"><label>{label}<input data-editor-control="image" value={value} placeholder="URL da imagem ou escolha um arquivo" onChange={e=>onChange(e.target.value)}/></label><label className="image-upload">Trocar imagem<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const next=e.target.files?.[0];e.target.value='';if(next)setFile(next)}}/></label>{value&&<><button type="button" className="studio-secondary" onClick={()=>void fetch(value).then(async response=>{if(!response.ok)throw Error();const blob=await response.blob();const source=await cropSource(blob);setError('');setFile(source)}).catch(()=>setError('Não foi possível abrir a imagem. Reenvie o arquivo original para recortar.'))}>Recortar/reposicionar</button><button type="button" className="studio-secondary" onClick={()=>void extractImageColors(value).then(colors=>{if(context){const identity=context.bio.identity,logo=/logo/i.test(label);context.onChange({identity:{...identity,...(logo?{logoPalette:colors}:{referencePalette:mergeColors([...(identity?.referencePalette||[]),...colors],10)}),sources:[...(identity?.sources||[]).filter(s=>s.name!==label),{name:label,role:logo?'logo' as const:'reference' as const,colors}].slice(-32)}})}setError('')}).catch(e=>setError(e.message))}>Extrair cores</button>{error&&<p role="alert">{error}</p>}<button type="button" className="studio-secondary" onClick={()=>onChange('')}>Remover imagem</button><img className="image-field-preview" src={value} alt={'Prévia: '+label}/></>}{file&&<ImageCropDialog aspect={aspect} file={file} onCancel={()=>setFile(null)} onConfirm={data=>{onChange(data);setFile(null)}}/>}</div>
}

