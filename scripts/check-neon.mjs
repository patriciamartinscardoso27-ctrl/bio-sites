import { readFile } from 'node:fs/promises'
import { parseEnv } from 'node:util'
import { neon } from '@neondatabase/serverless'

// Configuration is read only from this project's private file, not inherited
// from another project's shell environment. No connection secrets are logged.
const projectId = 'muddy-star-65783442'
class SetupError extends Error {}
async function check() {
  let config
  try {
    config = parseEnv(await readFile(new URL('../.env.server.local', import.meta.url), 'utf8'))
  } catch {
    throw new SetupError('Crie .env.server.local a partir de .env.server.example e preencha no computador.')
  }
  if (config.NEON_PROJECT_ID !== projectId) throw new SetupError('Projeto divergente. Use somente o projeto Neon confirmado para BioSite/Vitrine.')
  if (!config.NEON_BRANCH_ID || !config.NEON_DATABASE_NAME || !config.NEON_DATABASE_HOST || !config.DATABASE_URL) {
    throw new SetupError('Configuração pendente: preencha branch, database, host e DATABASE_URL em .env.server.local, diretamente no computador.')
  }
  let connection
  try { connection = new URL(config.DATABASE_URL) } catch { throw new SetupError('DATABASE_URL inválida. Copie a conexão PostgreSQL em Connect → Database.') }
  if (!['postgres:', 'postgresql:'].includes(connection.protocol) || !connection.hostname.endsWith('.neon.tech')) throw new SetupError('A conexão precisa ser PostgreSQL de um endpoint Neon.')
  if (connection.hostname !== config.NEON_DATABASE_HOST.trim().toLowerCase()) throw new SetupError('Host divergente do endpoint confirmado. Nenhuma consulta foi executada.')
  if (!['require','verify-full'].includes(connection.searchParams.get('sslmode'))) throw new SetupError('Use a conexão Neon com SSL habilitado (sslmode=require ou verify-full).')
  let database
  try { database = decodeURIComponent(connection.pathname.slice(1)) } catch { throw new SetupError('Nome do banco inválido na conexão.') }
  if (database !== config.NEON_DATABASE_NAME) throw new SetupError('Database divergente. Nenhuma consulta foi executada.')
  const sql = neon(config.DATABASE_URL)
  const [status, tables] = await sql.transaction([
    sql`SELECT current_database() AS database, current_setting('transaction_read_only') AS read_only`,
    sql`SELECT count(*)::int AS total FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
  ], { readOnly:true, fetchOptions:{ signal:AbortSignal.timeout(15000) } })
  if (status[0]?.database !== config.NEON_DATABASE_NAME || status[0]?.read_only !== 'on') throw new SetupError('A verificação de database ou modo somente leitura falhou.')
  console.log(`Conexão Neon confirmada para BioSite/Vitrine (${projectId}).`)
  console.log('Host e database conferidos. Transação somente leitura confirmada.')
  console.log(`Tabelas no schema public: ${tables[0]?.total}. Nenhum dado ou schema foi alterado.`)
}
check().catch(error=>{
  if(error instanceof SetupError)console.error(error.message)
  else {
    const code=typeof error?.code==='string'?error.code:''
    const messages={ '28P01':'Credenciais recusadas. Confira a conexão privadamente no arquivo do servidor.', '3D000':'Database não encontrado.', '42501':'A conexão não possui permissão para esta consulta.', 'ENOTFOUND':'O endpoint não foi encontrado. Confira o host e a rede.', 'ETIMEDOUT':'Tempo de conexão excedido. Confira a disponibilidade do banco e a rede.' }
    console.error(messages[code] || 'Não foi possível confirmar a conexão. Confira credenciais, endpoint e rede; detalhes privados foram omitidos.')
  }
  process.exitCode=1
})
