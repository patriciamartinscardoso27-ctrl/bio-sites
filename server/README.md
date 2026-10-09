# Persistência do Admin V1

Atualização: o login e a proteção da API estão descritos em [AUTH.md](AUTH.md). As referências abaixo a API sem login e testes anteriores registram a etapa de persistência anterior; agora todas as rotas privadas exigem sessão. O teste Neon exige sessão explícita.

Requer Node.js 24 (TypeScript nativo e registerHooks). `npm run dev` disponibiliza Vite + API na mesma origem em http://127.0.0.1:5173. `npm run preview` também inclui a API local. Para servir o build: `npm run build`, depois `npm start`, em http://127.0.0.1:3000. Hospedar dist/ estaticamente não substitui o servidor Node.

O servidor lê exclusivamente .env.server.local deste projeto e confere projeto/branch/database/role/SSL/endpoint pooled já informado para o BioSite. Não herda DATABASE_URL do shell, não importa o arquivo privado no frontend e não imprime mensagens/stacks do driver. Não acessa arquivos nem banco do Placa Fácil.

## Rotas

| Método e caminho | Comportamento |
| --- | --- |
| GET /api/biosites?cursor=UUID | Até 50 resumos de rascunho; nextCursor para continuar. Sem imagens/conteúdo completo na listagem. |
| POST /api/biosites | `{content: Bio}`. Cria admin singleton sob demanda, BioSite e revisão 1 atomicamente. Slug normalizado com UUID permanente. Bio.id é a chave de repetição: mesmo conteúdo não duplica o site; conteúdo diferente com ID existente retorna 409. |
| GET /api/biosites/UUID | Metadados e Bio completo da revisão de rascunho; 404 quando ausente. |
| PUT /api/biosites/UUID/draft | `{content: Bio, lockVersion: string}`. Bloqueia/compara versão, insere revisão imutável e troca apenas draft_revision numa operação atômica. Versão antiga retorna 409 sem sobrescrever. |

Sem DELETE, publish, upload, login ou página pública por slug. Payloads não podem definir slug, proprietário, status ou published_revision. FKs compostas isolam revisões por site. Validação usa o catálogo original dos 21 modelos/14 botões, sem cópias ou modificações. Bio inteiro é preservado em JSONB, inclusive ordem dos arrays. Comparação no cliente ignora somente ordem das chaves de objetos. Timestamps são ISO.

Salvar não altera status, published_revision ou published_at. A simulação anterior de publicação permanece explicitamente local. A futura publicação deverá conferir versão e apontar para a revisão escolhida; o endpoint público deverá servir somente published_revision de sites published.

## Rascunhos, cópias e falhas

Admin inicia na listagem real. Não importa rascunhos antigos nem insere demonstrações ao abrir. Finalizar fluxo rápido/Criar do Zero cria no banco e abre editor. Falhas mantêm conteúdo editável com mensagem e possibilidade de tentar novamente. Edições durante save pendente permanecem no editor e são sinalizadas como ainda não salvas.

Antes de salvar/recarregar, tenta preservar uma cópia por ID em `vitrine-neon-backup-v1:UUID`. A chave legada `vitrine-premium-drafts-v1` permanece intacta. Recuperação dessas novas cópias exige ação explícita na lista e não grava/importa no banco. Não substitui edições abertas ainda não salvas. Recarregar após conflito preserva a cópia anterior, recuperável pelo botão na lista. O navegador alerta ao sair com conteúdo pendente. Quota local cheia não bloqueia salvar remotamente, mas falha remota exigirá manter aba aberta. Sem autosave.

## Segurança e limites

Sem login, Admin **somente local**: loopback, validação de IP/Host/Origin, rejeição cross-site e Origin obrigatório em escritas. Sem wildcard CORS. Vite bloqueia arquivos privados e server/scripts/migrations; servidor do build serve só dist. Não expor por túnel/reverse proxy/internet. Processos no próprio computador podem acessar a API: isso não é autenticação.

Role owner existente contorna RLS. Queries parametrizadas, com timeout e escopo de admin/site; navegador nunca recebe credenciais/acesso ao banco. Antes de exposição pública: autenticação, autorização, role restrita/RLS de runtime e controles de abuso. Nenhuma migration nova nesta etapa.

Imagens permanecem URLs/data URLs PNG/JPEG/WebP; sem buckets/upload. Requests limitados a 32 MiB, arrays a 500 entradas. Imagens inline podem exceder limite/quota local; storage é pendência futura. Valida-se shape, IDs, categorias e modelos; validação de destinos dos botões continua no frontend atual. Não concatenamos conteúdo de usuário em SQL/HTML.

## Verificação

`npm test`: sem Neon, incluindo modelos/botões, validação, HTTP/API, origem, erros sem segredos, comparação JSONB e backups não destrutivos. `npm run build` e `npm run lint` completam checks locais.

`npm run test:neon:persistence`: teste real explicitamente **de escrita** pelas rotas HTTP. Verifica create/read/update, retry, slug, independência, stale saves, conteúdo de outro site, concorrência (200/409), novo repositório e listagem. Reruns reutilizam dois IDs de `review/neon-persistence.json`. Fixtures identificadas como teste, despublicadas e retidas: a migration proíbe DELETE para preservar slugs/histórico. Não desabilitamos triggers nem executamos DDL/migrations. Primeiro create inicializa singleton. O verificador antigo da migration pressupunha tabelas vazias; não reaplicar migration nem rodar seu teste de emptiness após persistir dados.

Relatório: `review/neon-persistence.json`. Interface também conferida: abrir fixture A, editar descrição, salvar, recarregar navegador e reabrir; conteúdo recuperado do Neon em 360/390 px, sem overflow. Screenshot: `review/neon-admin-mobile.png`. Fluxo rápido mostrou os três modelos da categoria e Criar do Zero preservou cinco passos. Nenhum teste manual foi solicitado.

Resultados em 05/10/2026: 29 testes locais passaram; build/lint passaram. Teste real no Neon passou, incluindo commits e leitura por nova conexão. Servidor do build retornou 200 para raiz/API, 404 para arquivos privados e 403 para escrita de origem externa. Vite retornou 403 para env/server/scripts. `scripts/check-persistence-build.mjs` confirmou 36 arquivos originais de src intactos (todos exceto App.tsx), migration inalterada e cinco arquivos do build sem credenciais ou driver Neon. `npm run neon:check` confirmou quatro tabelas no novo banco. O servidor usado para testar o build foi encerrado; o dev local foi mantido para abrir o Admin.

