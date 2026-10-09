# Primeira migration — aplicada e verificada

`0001_biosite.sql` foi aplicada após aprovação explícita em 05/10/2026, somente no endpoint confirmado do novo BioSite/Vitrine. A migration é transacional e cria quatro tabelas, oito índices implícitos de PK/UNIQUE, dois índices explícitos e duas funções com triggers. Não insere registros nem cria contas, login, buckets ou dados demonstrativos. Não reaplicar.

## Colunas exatas

Todas as colunas são NOT NULL, salvo as marcadas como opcionais.

| Tabela | Colunas |
| --- | --- |
| `biosite_admin` | `id uuid` (PK, UUID automático), `singleton boolean` (true, UNIQUE e CHECK true), `created_at timestamptz` (now) |
| `biosites` | `id uuid` (PK, UUID automático), `admin_id uuid` (FK), `slug text` (UNIQUE), `status text` (unpublished), `draft_revision bigint`, `published_revision bigint` (opcional), `lock_version bigint` (1), `created_at timestamptz` (now), `updated_at timestamptz` (now), `published_at timestamptz` (opcional), `unpublished_at timestamptz` (opcional) |
| `biosite_revisions` | `biosite_id uuid` (FK), `version bigint`, `schema_version integer` (1), `category text`, `template_id text`, `content jsonb`, `created_at timestamptz` (now). PK composta: biosite_id + version |
| `biosite_assets` | `id uuid` (PK, UUID automático), `biosite_id uuid` (FK), `storage_provider text`, `storage_key text`, `original_name text` (opcional), `mime_type text`, `byte_size bigint`, `metadata jsonb` (objeto vazio), `created_at timestamptz` (now) |

## Conteúdo e publicação

Cada revisão guarda o objeto `Bio` completo de `src/types/biosite.ts`, incluindo IDs internos, aparência, estilo, contatos e arrays ordenados. A categoria deve coincidir com `content.category`. `template_id` identifica o modelo selecionado do catálogo do frontend; não é o `Bio.id` nem necessariamente `Bio.style`. A validação de modelo existente, campos internos, URLs e limites de upload ficará no futuro backend. Nenhum dos 21 modelos é copiado, modificado ou removido.

Rascunho e publicação apontam para revisões independentes e imutáveis; podem apontar para a mesma revisão ao publicar. Salvar edições insere nova revisão e altera somente draft_revision. Publicar aponta published_revision para a revisão escolhida e muda status. Despublicar conserva a revisão publicada e o slug, mas muda status para unpublished. O endpoint público futuro deve verificar status e servir **somente** published_revision, nunca draft_revision. Categoria/template publicados vêm da revisão publicada; mudanças no rascunho não afetam a publicação.

O primeiro site e sua revisão devem ser inseridos numa única transação, pois as FKs dos ponteiros são diferidas até COMMIT. Todas as referências de revisões usam biosite_id + version, impedindo publicação/rascunho de outro BioSite. Versões são positivas e únicas por site. O backend deverá incrementar versões sob bloqueio ou comparar lock_version no UPDATE; o trigger incrementa lock_version, mas sozinho não detecta conflito entre editores.

## Constraints, índices e segurança

- Admin: no máximo um registro, sem dados de autenticação ou usuário inicial.
- Slug: único, minúsculo, 1–100 caracteres, letras ASCII, números e hífens entre segmentos. Trigger impede mudança de identidade, proprietário, slug e data de criação; impede DELETE. Não há liberação/reutilização de slug. O futuro backend deverá reservar rotas como admin/api antes da criação.
- Status limitado a published/unpublished. Publicado exige revisão e data. Datas de atualização/publicação/despublicação são mantidas no UPDATE pelo trigger; INSERT deverá usar valores iniciais coerentes no backend.
- Revisões não aceitam UPDATE/DELETE. JSONB exige objeto, campos estruturais e arrays essenciais, preservando a ordem dos arrays. Sem GIN desnecessário sobre conteúdo inteiro.
- FKs usam RESTRICT; não existe exclusão em cascata. Índices de PK/UNIQUE: admin.id, admin.singleton, biosites.id, biosites.slug, revisions.(biosite_id,version), assets.id, assets.(biosite_id,id), assets.(storage_provider,storage_key). Índices explícitos: biosites.(admin_id,updated_at DESC) e assets.(biosite_id,created_at DESC).
- Assets são referências futuras por site, não uploads. A chave do storage é globalmente única por provedor para evitar compartilhar o mesmo objeto entre sites. A chave composta (biosite_id,id) permite futuras FKs isoladas. Referências dentro de JSONB não têm FK: o backend deverá verificar propriedade dos assets antes de salvar/publicar. Não alteramos campos de imagens atuais.
- RLS habilitada sem policies: roles comuns não recebem acesso. Privilégios PUBLIC revogados nas quatro tabelas e duas funções. Funções não usam SECURITY DEFINER e fixam search_path. Owner/superuser/BYPASSRLS contornam RLS; esta migration não cria roles nem concede acesso. O isolamento contra chamadas usando a credencial owner depende do backend. Antes de implementar APIs, definir role de runtime com privilégios mínimos/policies e nunca entregar credenciais ao frontend.
- Trigger não protege contra TRUNCATE ou alteração de schema feita pelo owner. O futuro runtime não deve receber TRUNCATE, ownership ou DDL. Não há endpoint público, login ou mecanismo de aplicação nesta entrega.

## Verificação e aplicação

Após aplicação, `scripts/migration-0001.mjs verify` validou catálogo, colunas/tipos/nullability/defaults, 29 constraints de CHECK/PK/UNIQUE/FK (além de NOT NULL), 10 índices válidos, duas funções/triggers, RLS nas quatro tabelas, ausência de policies e grants PUBLIC, e ausência de tabelas extras em schemas de usuário. Testes comportamentais com fixtures verificaram singleton, slug, imutabilidade, FKs entre sites, separação de rascunho/publicação, versionamento e isolamento de storage; todas as fixtures foram revertidas. As quatro tabelas permaneceram vazias. Hashes de src/, tests/ e package.json foram comparados antes/depois, sem alterações. Relatório sem credenciais: `0001-verification.json`. O script conecta exclusivamente ao endpoint novo informado pelo usuário; não lê arquivos nem conecta ao banco do Placa Fácil. A identidade remota foi confirmada por endpoint/database/role; os IDs de projeto/branch foram conferidos na configuração local, sem consulta à API administrativa Neon.

Validação local concluída: `npm test` passou com 21 testes (incluindo os 21 modelos), `npm run build` passou e `npm run lint` passou. O runner de testes precisou de execução fora do sandbox por bloqueio de subprocessos (EPERM). Nenhum comando de banco foi executado nesta preparação.

`npm test`, `npm run build` e `npm run lint` validaram o frontend na preparação. O lint também passou após criação do verificador. A aplicação executou exatamente os statements do arquivo aprovado, em uma transação via Neon HTTP, preservando corpos de funções e substituindo somente BEGIN/COMMIT pelo envelope transacional do driver. Nenhuma outra migration foi enviada. A próxima etapa exige nova autorização.

