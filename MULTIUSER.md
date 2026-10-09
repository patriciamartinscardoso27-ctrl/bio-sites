# Multiusuário — implementação local, ativação pendente

Atualização de 09/10/2026: a migration 0002 já foi aplicada e verificada, sem alteração dos 9 BioSites e 220 revisões. Convites manuais dispensam Resend. A proteção adicional de cadastro direto usa o webhook Neon `user.before_create`; o aceite configurado exige `BIOSITE_SIGNUP_GUARD=enabled`, que só deve ser ativado após validar o webhook HTTPS em produção. O código local está preparado, mas o webhook consultado permanece desativado e não houve deploy desta implementação. Relatório detalhado: `artifacts/multiuser/signup-guard-report.md`. As descrições de migration/Resend abaixo registram o plano inicial, não são instrução para reaplicar a migration ou contratar e-mail.

O código foi implementado com ativação protegida por `BIOSITE_MULTIUSER=enabled`. O padrão continua desativado. Não houve migration, criação de usuário, envio de convite ou deploy em produção nesta etapa.

## Acesso e isolamento

- A conta atual permanece o único administrador principal. A migration importa apenas seus metadados do Neon Auth, sem alterar senha ou conta.
- Compradores usam os modelos centrais (inclusive modelos futuros), criação manual, Clientes, editor completo, salvamento e publicação/despublicação dos próprios BioSites. Não há quota comercial nem assinatura.
- Usuários, convites, bloqueio/reativação e consulta de todos os ambientes são exclusivos do principal.
- APIs de Gemini/referência com IA exigem principal antes de processar a solicitação. A interface também oculta essas ferramentas dos compradores.
- As operações protegidas verificam a sessão e a propriedade no backend. As operações de BioSites usam uma role PostgreSQL sem bypass de RLS. Revisões e arquivos vinculados seguem a propriedade do BioSite.
- Rascunhos permanecem privados. A leitura pública permite somente a revisão publicada. Bloquear um comprador corta seu acesso, mas não retira automaticamente suas páginas públicas do ar.
- O bloqueio registra uma data de invalidação das sessões; reativar exige login novo para sessões anteriores ao bloqueio.
- Novas cópias locais multiusuário são criptografadas com chave individual recebida após autenticação. Cópias legadas do principal são preservadas; essa proteção não substitui a segurança do dispositivo.

## Migration preparada

SQL: `migrations/0002_multiuser.sql`. Reversão: `migrations/0002_multiuser.rollback.sql`.

A migration adiciona usuários, propriedade, convites e eventos administrativos, uma role restrita, políticas e funções de autorização e um trigger para atribuir propriedade. Todos os BioSites existentes ficam vinculados ao principal. Os conteúdos e revisões existentes não são reescritos, os dois triggers de proteção originais permanecem ativos e nenhuma tabela original é removida. Não altera o schema Neon Auth.

O ID Auth já configurado do principal deve ser fornecido na sessão SQL antes da transação, conforme o cabeçalho do arquivo. Não substituir por UUID de exemplo. A compatibilidade transitória permite que a API antiga do principal continue criando BioSites entre migration e implantação; não concede esse caminho à role restrita.

A reversão SQL imediata preserva os dados originais. Ela recusa a execução quando já existem compradores, convites ou eventos, para não descartar novos dados. Depois da ativação, uma reversão exige conservar essas tabelas e avaliar o retorno da aplicação separadamente.

## Validação isolada concluída

Backup de produção obtido exclusivamente com SELECT: 9 BioSites e 220 revisões. O levantamento atual difere dos totais históricos 7/217; nenhum desses registros foi criado ou alterado por esta implementação.

Os 52 arquivos do backup foram verificados por SHA-256, restaurados em PostgreSQL isolado PGlite e reabertos. Os hashes dos registros originais permaneceram idênticos após migration, falha transacional e reversão imediata.

Resultados detalhados e backup privado: `artifacts/multiuser/`. Esses arquivos estão excluídos do Git e do build; não devem ser disponibilizados em uma galeria pública.

Testes confirmaram isolamento entre dois compradores sintéticos, proibição de leitura/escrita cruzada, prevenção de elevação de papel, acesso global do principal, bloqueio de sessões, publicação pública limitada, guards ativos e recusa de reversão que perderia compradores.

- 39 testes essenciais aprovados, incluindo os 76 modelos e edição Xavier.
- 8 testes multiusuário/interface aprovados; 17 testes de regressão posteriores aprovados.
- 7 testes Gemini aprovados com provedores simulados.
- TypeScript e build aprovados. O build mantém aviso de bundle acima de 500 kB.
- Conferência de arquivos/build: nenhum valor secreto local encontrado; evidências privadas excluídas.

O aceite de convite e a entrega de e-mail foram testados com provedores simulados. Não declarar envio real ou aceite real no Neon Auth como validado. A interface foi exercitada em testes de componentes; a navegação em aparelho Android e a revisão visual manual desta nova seção continuam pendentes.

## Configuração de e-mail e liberação

O envio real usa Resend pelo backend. É necessário configurar `RESEND_API_KEY` e `BIOSITE_INVITE_FROM`, com remetente/domínio verificado no serviço. Um domínio gratuito Vercel para o site não fornece automaticamente um remetente de e-mail. O plano/custo do serviço de e-mail é independente do Bio Sites; não há cobrança automática implementada.

O convite tem token aleatório de uso único, hash armazenado e validade de 48 horas. Reenvio revoga o convite anterior. O usuário escolhe a própria senha via Neon Auth; o Bio Sites não armazena senhas. Verificação e recuperação de senha dependem da configuração de e-mail do Neon Auth existente. É necessário conferir cadastro por convite, URLs permitidas e entrega de verificação/recuperação em teste real controlado.

Antes de liberar compradores:

1. Obter autorização específica para a migration de produção e atualizar o backup/verificação dos totais naquele momento.
2. Conferir permissões reais de criação/grant da role no Neon; aplicar o SQL aprovado atomicamente e verificar integridade.
3. Configurar e-mail, revisar URLs do Neon Auth e obter autorização para deploy/ativação. Não habilitar a flag antes da migration.
4. Com autorização específica para um usuário de teste, validar entrega, aceite, login, recuperação, bloqueio, criação manual, salvamento, publicação e isolamento no ambiente real.
5. Revisar a nova seção em mobile/desktop e, posteriormente, no APK. Não criar ou publicar BioSites automaticamente.

## Etapa seguinte: Vendas

Vendas foi incorporado ao planejamento e ainda não foi implementado. Deve começar após a consolidação segura do multiusuário.

- Botão **Registrar venda** dentro de cada BioSite.
- Após publicação confirmada, pergunta opcional **Deseja registrar esta venda?**, com **Registrar venda** e **Agora não**. Cancelar não interfere na publicação; atualizar/republicar não cria venda.
- Formulário: valor monetário em centavos, data, forma de pagamento, status pendente/pago e observações opcionais. Sem integração de pagamento ou mensalidades.
- Uma venda por BioSite, garantida por unicidade no banco e resposta idempotente no backend. Se já existir, abrir o registro existente; editar não aumenta a contagem de vendidos.
- Painel com histórico, filtros por data/status/pagamento/BioSite, total recebido, total pendente e quantidade distinta de BioSites vendidos. Principal também filtra por usuário.
- Propriedade derivada no servidor do BioSite, nunca de `userId` enviado pelo navegador. Verificações em todas as operações por ID e RLS no Neon, inclusive no histórico. Compradores acessam apenas suas vendas; principal consulta todas.
- Migration futura aditiva para vendas/histórico será apresentada e validada separadamente, com backup e reversão. Nenhuma tabela de vendas foi criada agora.
- Testes futuros: acesso cruzado, registro repetido/concor­rente, atualização/republicação sem duplicidade, valores e totais, pagamento pendente/pago, cancelamento do prompt e filtros do principal.

Não haverá venda automática nem obrigatoriedade de registrar venda para publicar.
