# Design system único — Descomplica Guarujá

Decisão confirmada por Gustavo em 26/09/2026. Site, apresentações e aplicativo compartilham a mesma identidade e os mesmos componentes base. O layout adapta-se à tarefa e à tela; não se cria uma nova linguagem visual para cada página.

## Fonte de verdade

- `design-system/tokens.css`: paleta, famílias tipográficas, escala de espaçamento, raios, sombras, tracking dos títulos e movimento.
- `design-system/fonts.css`: fontes locais Fraunces, Jost e Allura, incluindo fallbacks.
- `design-system/components.css`: botões e cartões base. Variações devem usar os tokens.
- `deck.css` / `deck.js`: composição, grades, controles, temas claro/escuro e navegação de **todas** as apresentações.
- `cultura-setur.css`: somente composições específicas desse conteúdo, sem segunda paleta ou escala de títulos.
- `app/`: importa diretamente a base compartilhada; componentes React podem encapsular os mesmos estilos. O build inclui a base; não copiar CSS manualmente.

## Regras de evolução

1. Consultar os componentes existentes antes de criar outro. Alteração de marca acontece na fonte compartilhada.
2. Fraunces para títulos, Jost para texto e controles, Allura restrita à assinatura da marca. Títulos sem tracking negativo.
3. Manter cores, contraste, estados de foco, área de toque de pelo menos 44px e suporte a movimento reduzido. Não usar placeholder como único rótulo.
4. Margens equilibradas e contêiner centrado; alinhamento do texto depende da composição. Não centralizar formulários ou parágrafos longos só para obter simetria.
5. Fotografias de apresentação preservam o enquadramento completo. Navegação fica fora da área rolável. Em celular pequeno, conteúdo pode rolar verticalmente e deve permanecer acessível; nunca cortar texto para caber no slide.
6. Nenhuma nova fonte externa, paleta ou conjunto de componentes independente. Casos específicos podem acrescentar composição, sem redefinir a identidade.
7. Antes de publicar alterações compartilhadas: checks estáticos, site e quiz, decks existentes e Cultura/SETUR em Chromium e WebKit. O app também passa por build, testes de domínio e navegação.

## Validação

`node tests/static-checks.cjs`

Com servidor estático local na porta 3000 e Playwright instalado:

- `python tests/browser-checks.py`: site, questionário e decks existentes.
- `python tests/cultura-setur-checks.py`: todos os 11 slides, 320–1920px, Chrome/Safari e movimento normal/reduzido.

Os testes interceptam destinos externos para não gerar contatos nem analytics reais. Os testes do aplicativo ficam em `app/`, com banco isolado e envio simulado.
