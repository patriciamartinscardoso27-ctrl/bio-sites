import { isDeepStrictEqual } from 'node:util'
import { neon } from '@neondatabase/serverless'
import { ApiError, isUuid, slugFor, validateBio, validateVersion } from './validation.mjs'
import {serverConfig} from './config.mjs'
import {validateSlug,assertPublishable,publicContent} from './publication.mjs'
import {createSales} from './sales.mjs'

const root = new URL('../', import.meta.url)
const normalize = record => Object.fromEntries(Object.entries(record).map(([key,value]) => [key,value instanceof Date ? value.toISOString() : value]))
export async function connectRepository() {
  let config
  try { config = await serverConfig() }
  catch { throw new ApiError(503, 'Configuração privada do servidor indisponível.') }
  let url
  try { url = new URL(config.DATABASE_URL) } catch { throw new ApiError(503, 'Configuração privada do servidor inválida.') }
  if (config.NEON_PROJECT_ID !== 'muddy-star-65783442' || config.NEON_BRANCH_ID !== 'br-raspy-pine-b4i56qaa'
    || config.NEON_DATABASE_NAME !== 'neondb' || config.NEON_DATABASE_HOST !== 'ep-cool-flower-b4g5hcwp-pooler.c-6.us-east-2.aws.neon.tech'
    || url.hostname !== config.NEON_DATABASE_HOST || url.pathname !== '/neondb'
    || decodeURIComponent(url.username) !== 'neondb_owner' || !['postgres:', 'postgresql:'].includes(url.protocol)
    || !['require','verify-full'].includes(url.searchParams.get('sslmode'))) {
    throw new ApiError(503, 'A configuração não corresponde ao Neon confirmado do BioSite.')
  }
  // A separate timeout per request; never reuse an expired AbortSignal.
  const sql = neon(config.DATABASE_URL)
  return createRepository(sql,{publicationWritesEnabled:config.BIOSITE_PUBLICATION_WRITES==='enabled',multiuserEnabled:config.BIOSITE_MULTIUSER==='enabled'})
}

export function createRepository(sql,{publicationWritesEnabled=false,multiuserEnabled=false,actor,selectedOwner}={}) {
  const projectScope = sql`SELECT id FROM public.biosite_admin WHERE singleton=true`
  const siteScope=multiuserEnabled?sql`SELECT o.biosite_id FROM public.biosite_ownership o JOIN public.biosite_users u ON u.auth_id=${actor?.id||''} AND u.status='active' WHERE (o.user_id=u.id OR u.role='principal') AND (${selectedOwner||null}::uuid IS NULL OR o.user_id=${selectedOwner||null}::uuid)`:null
  const ownership=multiuserEnabled?sql`b.id IN (${siteScope})`:sql`b.admin_id IN (${projectScope})`
  const projection = sql`b.id, b.slug, b.status, b.lock_version::text AS "lockVersion",
    b.draft_revision::text AS "draftRevision", b.published_revision::text AS "publishedRevision",
    b.created_at AS "createdAt", b.updated_at AS "updatedAt", b.published_at AS "publishedAt"`
  const queryOptions = () => ({ fetchOptions: { signal: AbortSignal.timeout(20000) } })
  const transaction=async queries=>{
    if(!multiuserEnabled)return sql.transaction(queries,queryOptions())
    const result=await sql.transaction([sql`SET LOCAL ROLE biosites_app_runtime`,sql`SELECT set_config('biosites.auth_id',${actor?.id||''},true),set_config('biosites.public',${actor?'no':'yes'},true)`,...queries],queryOptions());return result.slice(2)
  }
  const execute = async query => (await transaction([query]))[0]
  const checkId = id => { if (!isUuid(id)) throw new ApiError(400,'Identificador inválido.') }
  const safe = async fn => {
    try { return await fn() } catch (error) {
      if (error instanceof ApiError) throw error
      // Driver error messages and stacks can contain connection credentials.
      if (error?.code === '23505' || error?.code === '40001' || error?.code === '40P01') throw new ApiError(409,'Conflito ao salvar. Recarregue o BioSite e tente novamente.')
      throw new ApiError(503,'Não foi possível acessar o banco. Seu conteúdo continua no editor; tente novamente.')
    }
  }
  return {
    publicationWritesEnabled,
    sales:multiuserEnabled&&actor?createSales(sql,actor):undefined,
    forActor(user,ownerId){if(!multiuserEnabled)return this;if(!user?.id||user.status!=='active')throw new ApiError(401,'Entre novamente para continuar.');if(ownerId&&(!isUuid(ownerId)||user.role!=='principal'))throw new ApiError(403,'Filtro exclusivo do Administrador principal.');return createRepository(sql,{publicationWritesEnabled,multiuserEnabled,actor:user,selectedOwner:ownerId})},
    async getPublished(slug){
      validateSlug(slug)
      return safe(async()=>{const rows=await execute(sql`SELECT b.slug,b.published_revision::text AS revision,b.published_at AS "publishedAt",r.content FROM public.biosites b JOIN public.biosite_revisions r ON r.biosite_id=b.id AND r.version=b.published_revision WHERE b.slug=${slug} AND b.status='published'`);if(!rows.length)throw new ApiError(404,'Página não encontrada.');const row=normalize(rows[0]);return {...row,content:publicContent(row.content)}})
    },
    async publish(id,lockVersion,draftRevision){
      if(!publicationWritesEnabled)throw new ApiError(403,'Publicação remota aguardando autorização de ativação.')
      checkId(id);validateVersion(lockVersion);validateVersion(draftRevision);assertPublishable(await this.get(id))
      return safe(async()=>{const rows=await execute(sql`UPDATE public.biosites b SET status='published',published_revision=b.draft_revision WHERE b.id=${id}::uuid AND ${ownership} AND b.lock_version=${lockVersion}::bigint AND b.draft_revision=${draftRevision}::bigint RETURNING b.id`);if(!rows.length)throw new ApiError(409,'O rascunho mudou. Reabra antes de publicar.');return this.get(id)})
    },
    async unpublish(id,lockVersion){
      if(!publicationWritesEnabled)throw new ApiError(403,'Publicação remota aguardando autorização de ativação.')
      checkId(id);validateVersion(lockVersion);assertPublishable(await this.get(id))
      return safe(async()=>{const rows=await execute(sql`UPDATE public.biosites b SET status='unpublished' WHERE b.id=${id}::uuid AND ${ownership} AND b.lock_version=${lockVersion}::bigint RETURNING b.id`);if(!rows.length)throw new ApiError(409,'Este BioSite mudou. Reabra antes de retirar do ar.');return this.get(id)})
    },
    async isAdminEmail(adminId,email) {
      return safe(async()=>Boolean((await execute(sql`SELECT 1 FROM neon_auth."user" WHERE id=${adminId} AND lower(email)=lower(${email}) LIMIT 1`)).length))
    },
    async list(cursor) {
      if (cursor !== undefined) checkId(cursor)
      return safe(async () => {
        const rows = await execute(sql`SELECT ${projection}, r.content->>'name' AS name, r.category, r.content->>'style' AS style, r.content->>'layoutPreset' AS "layoutPreset",
          r.content->>'logo' AS logo, r.content->>'phone' AS phone, r.content->>'telephone' AS telephone, r.content->>'email' AS email, r.content->>'address' AS address, r.content->'client'->>'responsible' AS responsible, COALESCE(r.content->'client'->>'city',r.content->>'address') AS city, r.template_id AS "templateId", (r.content->'composition' IS NOT NULL) AS generated
          FROM public.biosites b JOIN public.biosite_revisions r ON r.biosite_id=b.id AND r.version=b.draft_revision
          WHERE ${ownership} AND (${cursor ?? null}::uuid IS NULL OR b.id > ${cursor ?? null}::uuid)
          ORDER BY b.id LIMIT 51`)
        return { items: rows.slice(0,50).map(normalize), nextCursor: rows.length > 50 ? rows[49].id : null }
      })
    },
    async get(id) {
      checkId(id)
      return safe(async () => {
        const rows = await execute(sql`SELECT ${projection}, r.template_id AS "templateId",r.content
          FROM public.biosites b JOIN public.biosite_revisions r ON r.biosite_id=b.id AND r.version=b.draft_revision
          WHERE b.id=${id}::uuid AND ${ownership}`)
        if (!rows.length) throw new ApiError(404,'BioSite não encontrado.')
        return normalize(rows[0])
      })
    },
    async create(content) {
      const templateId=validateBio(content)
      const slug=slugFor(content)
      if(multiuserEnabled){
        let existing;try{existing=await this.get(content.id)}catch(e){if(e.status!==404)throw e}
        if(existing){if(!isDeepStrictEqual(existing.content,content))throw new ApiError(409,'Este identificador já possui conteúdo salvo.');return existing}
      }
      return safe(async () => {
        // UUID supplied by createBio acts as the retry/idempotency key.
        const [, , , rows] = await transaction([
          multiuserEnabled?sql`SELECT id FROM public.biosite_admin WHERE singleton=true`:sql`INSERT INTO public.biosite_admin(singleton) VALUES(true) ON CONFLICT (singleton) DO NOTHING`,
          multiuserEnabled?sql`INSERT INTO public.biosites(id,admin_id,slug,draft_revision)
            SELECT ${content.id}::uuid,id,${slug},1 FROM public.biosite_admin WHERE singleton=true`:sql`INSERT INTO public.biosites(id,admin_id,slug,draft_revision)
            SELECT ${content.id}::uuid,id,${slug},1 FROM public.biosite_admin WHERE singleton=true
            ON CONFLICT (id) DO NOTHING`,
          sql`INSERT INTO public.biosite_revisions(biosite_id,version,category,template_id,content)
            VALUES(${content.id}::uuid,1,${content.category},${templateId},${JSON.stringify(content)}::jsonb)
            ON CONFLICT (biosite_id,version) DO NOTHING`,
          sql`SELECT ${projection}, r.template_id AS "templateId",r.content
            FROM public.biosites b JOIN public.biosite_revisions r ON r.biosite_id=b.id AND r.version=b.draft_revision
            WHERE b.id=${content.id}::uuid AND ${ownership}`,
        ])
        if (!rows[0]) throw new ApiError(409,'Não foi possível criar o BioSite.')
        if (!isDeepStrictEqual(rows[0].content,content)) throw new ApiError(409,'Este identificador já possui conteúdo salvo. Abra o BioSite existente; a cópia local foi preservada.')
        return normalize(rows[0])
      })
    },
    async save(id, content, lockVersion) {
      checkId(id);validateVersion(lockVersion)
      const templateId=validateBio(content,id)
      return safe(async () => {
        const rows=await execute(sql`WITH locked AS (
            SELECT b.id,b.draft_revision FROM public.biosites b
            WHERE b.id=${id}::uuid AND ${ownership} AND b.lock_version=${lockVersion}::bigint FOR UPDATE
          ), revision AS (
            INSERT INTO public.biosite_revisions(biosite_id,version,category,template_id,content)
            SELECT id,draft_revision+1,${content.category},${templateId},${JSON.stringify(content)}::jsonb FROM locked
            RETURNING biosite_id,version,template_id,content
          ), changed AS (
            UPDATE public.biosites b SET draft_revision=r.version FROM revision r WHERE b.id=r.biosite_id
            RETURNING ${projection}
          ) SELECT b.*,r.template_id AS "templateId",r.content FROM changed b JOIN revision r ON r.biosite_id=b.id`)
        if (!rows.length) {
          await this.get(id)
          throw new ApiError(409,'Este BioSite foi salvo em outra aba. Abra novamente a versão do banco antes de continuar; suas alterações locais foram preservadas.')
        }
        return normalize(rows[0])
      })
    },
  }
}

