export type PaymentMethod='pix'|'cash'|'card'|'transfer'|'other'
export type PaymentStatus='pending'|'paid'
export interface SaleFields {amountCents:number;soldOn:string;paymentMethod:PaymentMethod;paymentStatus:PaymentStatus;notes:string}
export interface Sale extends SaleFields {id:string;biositeId:string;ownerId:string;ownerName:string;clientName:string;clientResponsible:string;biositeName:string;lockVersion:string;createdAt:string;updatedAt:string}
export interface SaleTotals {count:number;totalCents:number;receivedCents:number;pendingCents:number;todayCount:number;todayCents:number;monthCount:number;monthCents:number}
export interface SalesResult {items:Sale[];nextCursor:string|null;totals:SaleTotals;chart:{month:string;amountCents:number}[]}
export const paymentLabels:Record<PaymentMethod,string>={pix:'PIX',cash:'Dinheiro',card:'Cartão',transfer:'Transferência',other:'Outro'}
export const money=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100)
export function parseSaleAmount(value:string):number|null{
 const normalized=value.trim().replace(/\s/g,'').replace(/^R\$/,'')
 if(!/^\d+(?:,\d{1,2})?$/.test(normalized))return null
 const [whole,fraction='']=normalized.split(','),cents=Number(whole)*100+Number(fraction.padEnd(2,'0'))
 return Number.isSafeInteger(cents)&&cents>0&&cents<=9999999999?cents:null
}
export const saleToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
async function request<T>(path:string,init?:RequestInit):Promise<T>{
 const response=await fetch('/api/sales'+path,{...init,headers:{'Content-Type':'application/json'},credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(25000)})
 const result=await response.json();if(response.status===401)window.dispatchEvent(new Event('biosite-session-expired'))
 if(!response.ok)throw new Error(result.error||'Não foi possível acessar as vendas.')
 return result
}
export const salesApi={
 async list(filters:Record<string,string>={}):Promise<SalesResult>{
  let result:SalesResult|null=null,cursor:string|null=null
  do{const params=new URLSearchParams(Object.entries(filters).filter(([,v])=>v));if(cursor)params.set('cursor',cursor)
   const page=await request<SalesResult>(params.size?'?'+params.toString():'');result=result?{...page,items:[...result.items,...page.items]}:page;cursor=page.nextCursor
  }while(cursor)
  return result!
 },
 forSite:(id:string)=>request<{sale:Sale|null}>('/by-biosite/'+encodeURIComponent(id)),
 create:(biositeId:string,fields:SaleFields)=>request<Sale>('',{method:'POST',body:JSON.stringify({biositeId,...fields})}),
 update:(sale:Sale,fields:SaleFields)=>request<Sale>('/'+encodeURIComponent(sale.id),{method:'PUT',body:JSON.stringify({...fields,lockVersion:sale.lockVersion})}),
}
