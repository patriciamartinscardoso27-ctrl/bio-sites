export interface Account {id:string;name:string;email:string;role:'principal'|'buyer';multiuser:boolean;backupKey?:string}
export const legacyAccount:Account={id:'legacy-admin',name:'Gabriel',email:'',role:'principal',multiuser:false}
export async function readAccount():Promise<Account>{
 const response=await fetch('/api/account',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(25000)})
 const value=await response.json();if(!response.ok||typeof value.id!=='string'||!['principal','buyer'].includes(value.role))throw new Error('Não foi possível confirmar suas permissões.')
 return value
}
