# Bio Sites: preparação de produção

Repositório exclusivo: https://github.com/patriciamartinscardoso27-ctrl/bio-sites

Projeto Vercel exclusivo: `bio-sites`, na conta `gabrielbotafogo006-5410`. O projeto Placa Fácil/plaquinhas não deve ser utilizado. Domínio gratuito atribuído: `https://bio-sites-sage.vercel.app`.

## Configuração privada do servidor

Definir apenas no projeto Bio Sites, nunca como variáveis VITE e nunca no Git:

- DATABASE_URL
- NEON_PROJECT_ID, NEON_BRANCH_ID, NEON_DATABASE_NAME, NEON_DATABASE_HOST
- NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET, BIOSITE_ADMIN_AUTH_ID
- PUBLIC_SITE_ORIGIN com a origem HTTPS exata atribuída pela Vercel
- BIOSITE_PUBLICATION_WRITES: enabled somente após autorização/validação de produção

Os valores locais já confirmados pertencem ao projeto Neon Bio Sites; não reutilizar credenciais de outro sistema. Permitir a origem HTTPS do Bio Sites no provedor Neon Auth e validar login, sessão, logout e recuperação. Nenhuma migration é necessária para os controles de publicação implementados.

Node 24 é obrigatório para o catálogo TypeScript compartilhado. O frontend usa Vite; o backend fica em api/handler.mjs com rewrites definidos em vercel.json. Antes do deploy final, validar também o empacotamento da função Vercel, não somente npm run build.

## Verificações

Executar npm run test:essential, npm run build e node scripts/check-release-files.mjs. Nunca incluir arquivos .env, .vercel ou os diretórios locais artifacts/review no Git/deploy. Estes podem conter cópias de clientes, fotos privadas, revisões e credenciais temporárias.

Não publicar clientes nem rascunhos automaticamente. Rascunhos são privados; salvar não atualiza uma página publicada até a ação explícita Atualizar publicação.

O visual moderno corrigido é o padrão de /admin. /admin?admin-look=classic mantém a apresentação anterior para comparação. Os 76 designs e o editor compartilhado não são alterados pelo visual do painel.

## Liberação pendente

A limpeza específica já foi autorizada, executada e conferida: 7 BioSites e 217 revisões preservados, ambos os guards ativos. Backup restaurável privado mantido. Nenhuma nova exclusão ou alteração estrutural está autorizada. As configurações de produção e o domínio exato devem ser conferidos antes de publicar; não utilizar wildcard de domínio.

Após liberação: configurar variáveis privadas/origem de autenticação, validar a função empacotada e publicar no projeto bio-sites. Confirmar segurança das rotas públicas e que os registros preservados não sofreram alterações.

Capacitor/APK Android será uma etapa posterior à versão web; nenhuma implementação Android está incluída nesta entrega.
