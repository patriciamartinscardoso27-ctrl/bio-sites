import {ApiError,isUuid,validateVersion} from './validation.mjs'

const methods=['pix','cash','card','transfer','other'],statuses=['pending','paid']
export function saleDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1900-01-01'||value>'9999-12-31'||!Number.isFinite(Date.parse(value+'T12:00:00Z'))||new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value)throw new ApiError(400,'Informe uma data de venda válida.')
 return value
}
function fields(value,editing=false){
 if(!value||typeof value!=='object'||Object.keys(value).some(k=>!['amountCents','soldOn','paymentMethod','paymentStatus','notes',editing?'lockVersion':'biositeId'].includes(k)))throw new ApiError(400,'Campos de venda não permitidos.')
 if(!Number.isSafeInteger(value.amountCents)||value.amountCents<1||value.amountCents>9999999999)throw new ApiError(400,'Informe um valor positivo, com no máximo duas casas decimais.')
 saleDate(value.soldOn)
 if(!methods.includes(value.paymentMethod)||!statuses.includes(value.paymentStatus))throw new ApiError(400,'Forma de pagamento ou situação inválida.')
 if(value.notes!==undefined&&(typeof value.notes!=='string'||value.notes.length>5000))throw new ApiError(400,'Observações devem ter até 5.000 caracteres.')
 if(editing)validateVersion(value.lockVersion)
 else if(!isUuid(value.biositeId))throw new ApiError(400,'BioSite inválido.')
 return {...value,notes:value.notes||''}
}
export function salesFilters(params,actor){
 if([...params.keys()].some(k=>!['from','to','status','method','ownerId','cursor'].includes(k))||[...params.keys()].some(k=>params.getAll(k).length!==1))throw new ApiError(400,'Filtros inválidos.')
 const f=Object.fromEntries(params)
 if(f.from)saleDate(f.from);if(f.to)saleDate(f.to)
 if(f.from&&f.to&&f.from>f.to)throw new ApiError(400,'O início deve ser anterior ao fim do período.')
 if(f.status&&!statuses.includes(f.status)||f.method&&!methods.includes(f.method))throw new ApiError(400,'Filtro de pagamento inválido.')
 if(f.ownerId&&actor.role!=='principal')throw new ApiError(403,'Filtro exclusivo do Admin principal.')
 if(f.ownerId&&!isUuid(f.ownerId)||f.cursor&&!isUuid(f.cursor))throw new ApiError(400,'Identificador de filtro inválido.')
 return f
}
export function createSales(sql,actor){
 const transact=async queries=>{
  if(!actor?.id||actor.status!=='active')throw new ApiError(401,'Entre novamente para continuar.')
  try{return (await sql.transaction([sql`SET LOCAL ROLE biosites_app_runtime`,sql`SELECT set_config('biosites.auth_id',${actor.id},true),set_config('biosites.public','no',true)`,...queries],{fetchOptions:{signal:AbortSignal.timeout(20000)}})).slice(2)}
  catch(e){if(e instanceof ApiError)throw e;if(e.code==='23505'||e.code==='40001')throw new ApiError(409,'Esta venda já foi registrada ou alterada. Reabra antes de salvar.');if(e.code==='42P01')throw new ApiError(503,'Vendas aguardam a ativação da estrutura no banco.');throw new ApiError(503,'Não foi possível acessar as vendas. Tente novamente.')}
 }
 const projection=sql`s.id,s.biosite_id AS "biositeId",s.owner_id AS "ownerId",s.amount_cents::float8 AS "amountCents",s.sold_on::text AS "soldOn",s.payment_method AS "paymentMethod",s.payment_status AS "paymentStatus",s.notes,s.lock_version::text AS "lockVersion",s.created_at AS "createdAt",s.updated_at AS "updatedAt",r.content->>'name' AS "clientName",COALESCE(r.content->'client'->>'responsible','') AS "clientResponsible",r.content->>'name' AS "biositeName",u.name AS "ownerName"`
 const joins=sql`JOIN public.biosites b ON b.id=s.biosite_id JOIN public.biosite_revisions r ON r.biosite_id=b.id AND r.version=b.draft_revision JOIN public.biosite_users u ON u.id=s.owner_id`
 const id=value=>{if(!isUuid(value))throw new ApiError(400,'Identificador inválido.');return value}
 const single=async(where)=>{const [rows]=await transact([sql`SELECT ${projection} FROM public.biosite_sales s ${joins} WHERE ${where}`]);return rows[0]}
 return {
  async get(value){const row=await single(sql`s.id=${id(value)}::uuid`);if(!row)throw new ApiError(404,'Venda não encontrada.');return row},
  async forSite(value){
   const [site]=await transact([sql`SELECT id FROM public.biosites WHERE id=${id(value)}::uuid AND public.biosite_owns(id)`]);if(!site.length)throw new ApiError(404,'BioSite não encontrado.')
   return {sale:await single(sql`s.biosite_id=${value}::uuid`)||null}
  },
  async create(value){
   const v=fields(value)
   const [rows]=await transact([sql`INSERT INTO public.biosite_sales(biosite_id,owner_id,amount_cents,sold_on,payment_method,payment_status,notes)
    SELECT o.biosite_id,o.user_id,${v.amountCents},${v.soldOn}::date,${v.paymentMethod},${v.paymentStatus},${v.notes} FROM public.biosite_ownership o
    WHERE o.biosite_id=${v.biositeId}::uuid AND public.biosite_owns(o.biosite_id) ON CONFLICT(biosite_id) DO NOTHING RETURNING id`])
   if(!rows.length){const existing=await this.forSite(v.biositeId);if(existing.sale)throw new ApiError(409,'Este BioSite já possui uma venda. Edite o registro existente.');throw new ApiError(404,'BioSite não encontrado.')}
   return this.get(rows[0].id)
  },
  async update(value,input){
   id(value);const v=fields(input,true)
   const [rows]=await transact([sql`UPDATE public.biosite_sales SET amount_cents=${v.amountCents},sold_on=${v.soldOn}::date,payment_method=${v.paymentMethod},payment_status=${v.paymentStatus},notes=${v.notes} WHERE id=${value}::uuid AND lock_version=${v.lockVersion}::bigint RETURNING id`])
   if(!rows.length){await this.get(value);throw new ApiError(409,'Esta venda mudou em outra aba. Reabra antes de editar.')}
   return this.get(value)
  },
  async list(params){
   const f=salesFilters(params,actor),today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
   const filter=sql`(${f.from||null}::date IS NULL OR s.sold_on>=${f.from||null}::date) AND (${f.to||null}::date IS NULL OR s.sold_on<=${f.to||null}::date) AND (${f.status||null}::text IS NULL OR s.payment_status=${f.status||null}) AND (${f.method||null}::text IS NULL OR s.payment_method=${f.method||null}) AND (${f.ownerId||null}::uuid IS NULL OR s.owner_id=${f.ownerId||null}::uuid)`
   const [rows,totals,chart]=await transact([
    sql`SELECT ${projection} FROM public.biosite_sales s ${joins} WHERE ${filter} AND (${f.cursor||null}::uuid IS NULL OR s.id>${f.cursor||null}::uuid) ORDER BY s.id LIMIT 101`,
    sql`SELECT count(*)::int AS count,COALESCE(sum(amount_cents),0)::float8 AS "totalCents",COALESCE(sum(amount_cents) FILTER(WHERE payment_status='paid'),0)::float8 AS "receivedCents",COALESCE(sum(amount_cents) FILTER(WHERE payment_status='pending'),0)::float8 AS "pendingCents",count(*) FILTER(WHERE sold_on=${today}::date)::int AS "todayCount",COALESCE(sum(amount_cents) FILTER(WHERE sold_on=${today}::date),0)::float8 AS "todayCents",count(*) FILTER(WHERE date_trunc('month',sold_on)=date_trunc('month',${today}::date))::int AS "monthCount",COALESCE(sum(amount_cents) FILTER(WHERE date_trunc('month',sold_on)=date_trunc('month',${today}::date)),0)::float8 AS "monthCents" FROM public.biosite_sales s WHERE ${filter}`,
    sql`SELECT to_char(sold_on,'YYYY-MM') AS month,sum(amount_cents)::float8 AS "amountCents" FROM public.biosite_sales s WHERE ${filter} GROUP BY to_char(sold_on,'YYYY-MM') ORDER BY month DESC LIMIT 12`
   ])
   return {items:rows.slice(0,100),nextCursor:rows.length>100?rows[99].id:null,totals:totals[0],chart:chart.reverse()}
  }
 }
}
