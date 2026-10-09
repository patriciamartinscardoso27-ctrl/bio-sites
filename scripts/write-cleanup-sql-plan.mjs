import fs from 'node:fs/promises'
const i=JSON.parse(await fs.readFile('artifacts/neon-cleanup/inventory.json','utf8'))
const fingerprints=JSON.parse(await fs.readFile(i.files.fingerprints.path,'utf8'))
const targets=i.inventory.filter(x=>x.recommendation.startsWith('EXCLUIR')).map(x=>x.id)
const uuids=targets.map(x=>`'${x}'::uuid`).join(',')
const rows=[...fingerprints[0].map(x=>['site',x.id,'0',x.hash]),...fingerprints[1].map(x=>['revision',x.biosite_id,x.version,x.hash])]
const values=rows.map(x=>'('+x.map(v=>`'${v}'`).join(',')+')').join(',\n')
const sql=`-- PROPOSTA SOMENTE. NÃO EXECUTADA. Exige aprovação dos 7 IDs E da manutenção temporária dos triggers.
-- Projeto muddy-star-65783442 / branch br-raspy-pine-b4i56qaa / neondb.
-- Backup verificado em 2026-10-09. Se qualquer linha mudou, ROLLBACK obrigatório e novo levantamento.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
LOCK TABLE public.biosites, public.biosite_revisions, public.biosite_assets, public.biosite_admin IN ACCESS EXCLUSIVE MODE;
CREATE TEMP TABLE cleanup_expected(kind text, id uuid, version bigint, hash text) ON COMMIT DROP;
INSERT INTO cleanup_expected VALUES
${values};
DO $check$
BEGIN
 IF (SELECT count(*) FROM public.biosites) <> 14 OR (SELECT count(*) FROM public.biosite_revisions) <> 269
 OR (SELECT count(*) FROM public.biosite_admin) <> 1 OR (SELECT count(*) FROM public.biosite_assets) <> 0 THEN
  RAISE EXCEPTION 'Inventário mudou; limpeza cancelada';
 END IF;
 IF EXISTS(SELECT 1 FROM cleanup_expected e LEFT JOIN public.biosites b ON b.id=e.id WHERE e.kind='site' AND (b.id IS NULL OR md5(row_to_json(b)::text)<>e.hash))
 OR EXISTS(SELECT 1 FROM cleanup_expected e LEFT JOIN public.biosite_revisions r ON r.biosite_id=e.id AND r.version=e.version WHERE e.kind='revision' AND (r.biosite_id IS NULL OR md5(row_to_json(r)::text)<>e.hash)) THEN
  RAISE EXCEPTION 'Conteúdo mudou em relação ao backup; limpeza cancelada';
 END IF;
 IF (SELECT count(*) FROM public.biosites WHERE id IN (${uuids}) AND status='unpublished' AND published_revision IS NULL) <> 7
 OR (SELECT count(*) FROM public.biosite_revisions WHERE biosite_id IN (${uuids})) <> 52 THEN
  RAISE EXCEPTION 'Alvos ou contagens inválidos; limpeza cancelada';
 END IF;
END $check$;
-- ÚNICA manutenção estrutural temporária proposta. Nenhum trigger/função/tabela permanente é removido.
ALTER TABLE public.biosite_revisions DISABLE TRIGGER biosite_revisions_guard;
ALTER TABLE public.biosites DISABLE TRIGGER biosites_guard;
SET CONSTRAINTS biosites_draft_fk, biosites_published_fk DEFERRED;
DELETE FROM public.biosite_revisions WHERE biosite_id IN (${uuids});
DELETE FROM public.biosites WHERE id IN (${uuids});
SET CONSTRAINTS ALL IMMEDIATE;
ALTER TABLE public.biosite_revisions ENABLE TRIGGER biosite_revisions_guard;
ALTER TABLE public.biosites ENABLE TRIGGER biosites_guard;
DO $check$
BEGIN
 IF (SELECT count(*) FROM public.biosites) <> 7 OR (SELECT count(*) FROM public.biosite_revisions) <> 217
 OR (SELECT count(*) FROM public.biosite_admin) <> 1 OR (SELECT count(*) FROM public.biosite_assets) <> 0 THEN
  RAISE EXCEPTION 'Contagens finais inválidas; desfazer transação';
 END IF;
 IF EXISTS(SELECT 1 FROM cleanup_expected e LEFT JOIN public.biosites b ON b.id=e.id WHERE e.kind='site' AND e.id NOT IN (${uuids}) AND (b.id IS NULL OR md5(row_to_json(b)::text)<>e.hash))
 OR EXISTS(SELECT 1 FROM cleanup_expected e LEFT JOIN public.biosite_revisions r ON r.biosite_id=e.id AND r.version=e.version WHERE e.kind='revision' AND e.id NOT IN (${uuids}) AND (r.biosite_id IS NULL OR md5(row_to_json(r)::text)<>e.hash)) THEN
  RAISE EXCEPTION 'Registro preservado mudou; desfazer transação';
 END IF;
 IF (SELECT count(*) FROM pg_trigger WHERE tgname IN ('biosites_guard','biosite_revisions_guard') AND tgenabled='O' AND tgrelid IN ('public.biosites'::regclass,'public.biosite_revisions'::regclass)) <> 2 THEN
  RAISE EXCEPTION 'Proteções não restauradas; desfazer transação';
 END IF;
END $check$;
COMMIT;
-- Não executar automaticamente. Não publica nenhum BioSite.
`
await fs.writeFile('artifacts/neon-cleanup/proposed-cleanup.sql',sql)
await fs.appendFile('artifacts/neon-cleanup/report.md','\n## SQL concreto para revisão — NÃO EXECUTADO\n\nArquivo: proposed-cleanup.sql. Solicita aprovação específica para excluir os sete IDs listados e suas 52 revisões, com DISABLE/ENABLE temporário dos dois triggers, na mesma transação. Bloqueia concorrência por até 60 segundos, compara todos os registros com os hashes do backup, rejeita mudanças, verifica os sete registros preservados e suas 217 revisões e restaura as proteções antes de COMMIT. Em qualquer erro, a execução deve encerrar com ROLLBACK. A tabela temporária de conferência é removida ao encerrar a transação. O plano não foi executado nem ensaiado no Neon.\n')
console.log('Plano SQL preparado localmente; nenhuma instrução enviada ao Neon.')
