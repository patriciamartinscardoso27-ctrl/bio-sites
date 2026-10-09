import {useState} from 'react'
export function RemoveItemControl({label,onRemove}:{label:string;onRemove:()=>void}){
 const [confirm,setConfirm]=useState(false)
 return <div className="studio-context-danger">{confirm?<div role="group" aria-label="Confirmar remoção do item"><strong>Remover o item “{label}”?</strong><p>O conteúdo deste item será removido deste rascunho. Você pode desfazer a edição.</p><button onClick={()=>setConfirm(false)}>Cancelar</button><button className="studio-destructive" onClick={onRemove}>Remover</button></div>:<button className="studio-destructive" onClick={()=>setConfirm(true)}>Remover item</button>}</div>
}
