# BioSite + Vitrine — biblioteca mobile

Biblioteca com **21 modelos: três por categoria**. Loja da Ana (Boutique Gold) e Barbearia do João (Black Gold) mantêm suas apresentações aprovadas. Os outros modelos usam composições de capa, perfil e identidade dividida, com ações, cards, galerias e ordem de conteúdo próprias.

## Abrir e criar

Execute `npm run dev` e acesse http://127.0.0.1:5173/.

**Novo BioSite → informações rápidas → três modelos da categoria → visualizar → usar este modelo**. Nome, contatos, localização e imagens opcionais já aparecem nas opções e na prévia. O editor abre com conteúdo demonstrativo completo para mostrar ao cliente.

**Criar do Zero** é a opção secundária. Usa uma base preenchida da categoria e cinco passos: Informações, Visual, Conteúdo, Organização e Prévia. Permite tema claro/escuro, duas cores, fonte, formato dos botões/cards, ativação de seções e ordem por setas. O conteúdo pode ser ajustado no editor após criar.

## Modelos

| Categoria | Modelos |
| --- | --- |
| Loja de Roupas | Boutique Gold, Fashion Pink, Clean Nude |
| Barbearia | Black Gold, Vintage Barber, Urban Street |
| Salão / Estética | Rose Gold, Nude Elegance, Luxury Black |
| Restaurante / Lanchonete | Gourmet Dark, Fast Food Red, Rustic Kitchen |
| Doceria / Padaria | Candy Pink, Chocolate Premium, Clean Patisserie |
| Oficina / Serviços | Auto Premium, Performance Red, Tech Blue |
| Comercial Geral | Business Premium, Modern Blue, Clean Minimal |

## Edição e celular

- Os 14 tipos de ação, ícones, validações e destinos continuam disponíveis.
- Nome, descrição, capa, logo, contatos, ações, produtos/serviços, preços, fotos, promoção, coleções, diferenciais, galeria, depoimentos, horários e endereço são editáveis.
- Seções e ações podem ser ativadas, removidas e reordenadas. A vitrine mostra até seis itens, sem checkout.
- Editor com formulários em uma coluna no celular, controles de toque de pelo menos 44 px e prévia em aba própria ou tela cheia. No desktop a prévia pode ficar ao lado do editor.
- Upload local PNG/JPG/WebP até 15 MB, redimensionado no navegador até 1600 px, além de URLs.
- Salvar rascunho grava uma nova revisão no Neon pela API do servidor. Cópias locais usam chaves separadas; os rascunhos anteriores permanecem intactos e não são importados automaticamente.

## Verificação

`npm run build`, `npm run lint`, `npm test`.

Conferência dos 21 modelos no navegador em 360 e 390 px, sem rolagem horizontal. Fluxos de criação por modelo e manual conferidos em smartphone, incluindo personalização, tema, fonte, botões/cards, ativação e organização das seções.

## Limites

O Admin local salva, lista e recupera rascunhos reais no Neon por API. Execute `npm run dev`; para o build, `npm run build` e `npm start`. Requer Node 24 e configuração privada em `.env.server.local`. [Detalhes da API, segurança e testes](server/README.md).

Publicar/despublicar continuam sendo simulações locais, sem página pública hospedada. Fotos demonstrativas usam internet; imagens escolhidas do dispositivo permanecem no JSONB temporariamente. Avaliações, contatos, preços e endereços demonstrativos são fictícios. Como chegar abre Google Maps. Sem login, storage, checkout ou pagamentos; a API fica restrita ao computador local até a etapa de autenticação.
