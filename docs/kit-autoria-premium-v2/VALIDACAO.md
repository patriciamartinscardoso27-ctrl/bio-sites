# Validação da implementação V2 — 16/10/2026

Base Git continua `8825e84`. Não houve commit, push, deploy, criação/importação de cliente em produção, alteração de modelo original ou operação no Neon. O Gemini não foi usado para gerar designs; regressões da função Criar com IA usam respostas de provedor simuladas.

## Implementação

- `src/lib/premiumVisualV2.ts`: tipos e validação sem código arbitrário, compatibilidade por componente, camadas/gradientes seguros, regiões, vínculos e responsividade.
- `src/lib/premiumDesignPackage.ts`: dispatch V1/V2 no mesmo envelope, inventário e componentes coerentes, UUID novo na importação. V1 mantém seu caminho anterior.
- `src/components/biosite/PremiumV2BioSite.tsx` e `src/styles/premiumV2.css`: renderizador opt-in genérico, CSS limitado a `.premium-v2`, sem seletores por cliente.
- `src/components/BioSite.tsx` e `src/types/biosite.ts`: propriedade opcional e dispatch V2; clientes sem a propriedade usam as rotas anteriores.
- `server/validation.mjs`, `server/premium-design.mjs`: validação V2 também no fluxo de salvar Bio e resposta com a versão correta.
- `server/publication.mjs`: projeção pública preserva premiumV2 quando presente, sem expor notas de cliente. Sem esse ajuste, o renderer público perderia a composição após salvar/publicar no futuro. A projeção V1 permanece igual.
- `src/components/PremiumDesignImport.tsx`: aceita ambas as versões, apresenta prévia pelo renderer real e informa o limite dos controles visuais legados.
- Nenhum componente do editor existente foi alterado. IDs e campos permitem usar os editores atuais para conteúdo.

Existem outras alterações antigas no workspace, inclusive em alguns desses arquivos compartilhados; elas não foram revertidas nem publicadas. Uma eventual autorização de publicação exige selecionar o diff desta função com cuidado.

## Testes e build

```powershell
node --test --experimental-test-isolation=none tests/premiumV2.test.mjs tests/premiumDesignPackage.test.mjs tests/premiumAuthoringKit.test.mjs tests/geminiConfig.test.mjs tests/geminiVision.test.mjs tests/aiBuilder.test.mjs
# 31 aprovados, exit 0

node --test --test-concurrency=1 tests/premiumV2UI.test.mjs tests/premiumDesignRender.test.mjs tests/premiumDesignUI.test.mjs
# 13 aprovados, exit 0; inclui limpeza

node --test tests/premiumV2UI.test.mjs
# 5 aprovados após ampliar a prova de edição do destino do botão, exit 0

npm run build
# TypeScript e Vite aprovados, exit 0; permanece aviso de chunks > 500 kB
```

São 44 testes distintos aprovados nas suítes principais. A execução isolada final repete os cinco testes V2 de interface. Podem aparecer avisos React sobre resolução assíncrona de recursos fora de act na limpeza; não houve falhas.

Cobertura: round-trip V2, inventário, manifest/versionamento, propriedades desconhecidas, controles V1 incompatíveis, vínculos inexistentes, variantes incorretas, gradientes inválidos, comparação com índices iguais, rejeição de propriedades de código arbitrário, projeção pública, endpoint autenticado sem persistência, regressões V1 e Criar com IA simulado. O schema teve referências internas e catálogo de propriedades conferidos; ele não substitui as verificações semânticas do importador.

Editabilidade: renderização original/reimportada com markup idêntico; resolução de proprietários para logo, capa, chamada, serviço, ação e foto; alteração real de título/foto/preço do serviço, texto de seção e título/URL de ação pelos componentes atuais do editor. A configuração premiumV2 permanece idêntica durante essas edições. Nenhum teste salva no Neon.

## Verificação no navegador

Prévia local isolada, sem API/banco: `http://127.0.0.1:5174/artifacts/premium-v2/preview.html`. Não é URL de produção. O servidor de teste foi iniciado exclusivamente para esta verificação; o servidor do usuário na porta 5173 foi preservado.

| Viewport | Largura real da página | Hero | Chamada | Imagens com falha/pendentes | Overflow horizontal | Texto do hero fora da região |
| --- | ---: | ---: | ---: | --- | --- | --- |
| 360 | 360 | 580px | 34px | 0 / 0 | Não | Não |
| 390 | 390 | 600px | 36px | 0 / 0 | Não | Não |
| 430 | 430 | 620px | 38px | 0 / 0 | Não | Não |

Capturas completas em `referencias-renderizadas/` foram produzidas pelo mesmo JSON demonstrativo e renderer V2, não por geração de imagem. A ferramenta de navegador usou viewport controlado e o restaurou ao terminar. A prévia oculta apenas a barra de rolagem de desktop para reproduzir a largura útil móvel inteira; isso não altera o CSS das páginas do sistema.

Foi aberto e fechado o primeiro detalhe de serviço pelo navegador: expansão na mesma página, sem mudar URL ou abrir outro site. O antes/depois foi verificado como range interativo no teste de interface. Não houve disparo de WhatsApp, pedido ou mensagem.

## Exemplos e limitações

- `beleza-premium-v2.biosite.json`: 32.725 bytes, 13 seções e 25 referências de mídia, todas existentes na instalação. Não altera o cliente Essência; é um pacote demonstrativo independente.
- `comparacao-v2.biosite.json`: 2.840 bytes, uma seção, quatro referências contando mídias globais preservadas; mostra Foto A/Foto B, sem afirmar um antes/depois real.
- Fontes externas/manuscritas, filtros/abas de catálogo, vídeo V2 genérico, múltiplas regiões de texto em banner e editor visual do layout V2 ainda não foram implementados.
- A fidelidade está limitada pela resolução/recorte das fotos fornecidas. Não foi criada foto da segunda profissional, fachada inexistente ou resultado artificial; o card deixa a mídia faltante explícita. Contatos example.com e endereço de demonstração devem ser substituídos antes de qualquer publicação.
- Não foi executada comparação matemática pixel-a-pixel com o mockup original: conteúdo/fotos disponíveis diferem. A revisão confirma o renderer real nas três larguras, não identidade visual de 100% ao mockup independente.
- Não houve prova de salvamento/publicação em produção, por restrição expressa do usuário. Validação e projeção pública foram testadas localmente.

## Publicação controlada

A versão foi validada novamente com 47 testes e build. Três fotos reais necessárias ao demonstrativo usam arquivos exclusivos `premium-v2-demo-*`, sem substituir mídias de clientes. A validação em produção limita-se à exportação, reimportação e prévia em memória, sem criar ou salvar clientes.
