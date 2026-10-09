// Read-only; no recovery email, user mutation, password or token access.
import { readFile } from 'node:fs/promises'
import { parseEnv } from 'node:util'
import { neon } from '@neondatabase/serverless'
import { connectRepository } from '../server/repository.mjs'
try {
  const repository=await connectRepository()
  const config=parseEnv(await readFile(new URL('../.env.server.local',import.meta.url),'utf8'))
  const sql=neon(config.DATABASE_URL)
  const users=await sql.query('SELECT email FROM neon_auth."user" WHERE id=$1',[config.BIOSITE_ADMIN_AUTH_ID],{fetchOptions:{signal:AbortSignal.timeout(15000)}})
  if(users.length!==1||!await repository.isAdminEmail(config.BIOSITE_ADMIN_AUTH_ID,users[0].email)||await repository.isAdminEmail(config.BIOSITE_ADMIN_AUTH_ID,'unrelated@example.invalid'))throw Error()
  console.log('PASS: existing Admin matches; unrelated email rejected; read-only check.')
}catch{
  console.error('FAIL: Admin lookup unavailable; all private details omitted.')
  process.exitCode=1
}
