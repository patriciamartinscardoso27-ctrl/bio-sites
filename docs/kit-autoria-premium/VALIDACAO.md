# Validação local — 16/10/2026

Base Git: `8825e84`. As mudanças anteriores de separação de origens continuam locais. Nenhum commit, push, deploy, importação em produção ou gravação de cliente foi realizado nesta revisão.

## Revisão das quatro alterações anteriores

- `src/components/PremiumDesignImport.tsx`: origem padrão `models`, catálogo `readyTemplates`, configuração `previewBio || bio`, cópia com UUID transitório, clientes consultados somente na origem explícita, prévia limpa ao trocar seleção. O arquivo externo continua independente. Nenhum endpoint de persistência é acionado pela exportação/reimportação.
- `tests/premiumDesignUI.test.mjs`: cobre default, catálogo real sem consulta a clientes, origem clientes, aprovação explícita, arquivo inválido e arquivo externo válido sem gravação. Nesta revisão a seleção de clientes também foi explicitada no teste correspondente para não depender da sequência anterior.
- `tests/premiumDesignRender.test.mjs`: compara estrutura/markup do modelo real e o renderer existente; watcher desligado nos testes para evitar varredura desnecessária do workspace. Nesta revisão passou a verificar os dois exemplos compartilháveis.
- `docs/premium-design-import-v1.md`: documenta as origens e o UUID transitório, sem prometer comparação de pixels.

Nenhuma alteração adicional em código de produção foi necessária nesta etapa. Os arquivos novos são documentação, exemplos, utilitários locais do kit e testes.

## Resultados

```powershell
node --test --experimental-test-isolation=none tests/premiumDesignPackage.test.mjs tests/premiumAuthoringKit.test.mjs
# 9 testes aprovados; exit 0

node --test --test-concurrency=1 tests/premiumDesignRender.test.mjs tests/premiumDesignUI.test.mjs
# 8 testes aprovados (inclui cleanup); exit 0

node docs/kit-autoria-premium/validar.mjs docs/kit-autoria-premium/exemplos/aurora-flexivel.biosite.json docs/kit-autoria-premium/exemplos/xavier-biblioteca.biosite.json
# ambos accepted:true; persisted:false; exit 0

npm run build
# TypeScript e Vite aprovados; exit 0. Aviso de chunks acima de 500 kB permanece.
```

| Exemplo | Bytes UTF-8 | Perfil | Seções | Referências de mídia |
| --- | ---: | --- | ---: | ---: |
| Aurora fictício | 10.175 | flexible, sem preset | 8 | 8 |
| Xavier da biblioteca | 16.679 | preset moda-premium-gold | 14 | 17 |

A reimportação troca somente o UUID raiz e preserva os dados públicos. Os testes compararam também o markup real emitido por BioSite nas composições flexível e preset. A biblioteca original não é modificada. O teste do endpoint usa autenticação/repositório simulados e falha se houver acesso ao Neon ou Gemini.

## Limites da evidência

- JSON Schema é referência estrutural; os exemplos foram aceitos pelos validadores reais, não apenas por inspeção do schema. Referências internas do schema e enums do catálogo também foram conferidos por teste.
- Não foi executado um motor externo de JSON Schema neste ambiente; a aceitação real não depende dele.
- Não houve comparação por pixels, captura de navegador nem download/verificação de disponibilidade das imagens remotas. Os exemplos preservam URLs; sua aceitação não garante hospedagem/licença/permanência das mídias.
- O exemplo Aurora é fictício, usa fotos ilustrativas e URLs example.com. WhatsApp fica sem número intencionalmente; substitua contatos e mídias antes de publicar. Nenhum anúncio, depoimento ou estabelecimento real foi criado.
- Testes/build não demonstram equivalência de qualquer mockup criado separadamente. A revisão visual no importador, nas larguras pretendidas, continua necessária.
- O kit documenta a árvore local atual, incluindo contratos previamente existentes. Não adiciona suporte visual novo nem publica as quatro alterações locais.
