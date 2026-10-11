# Descomplica Guarujá — Experiências e quiz

Site estático em HTML, CSS e JavaScript nativo, sem framework e sem build. Oferece A Dois (2 pessoas) e Celebrar, Entre Amigas e Pedido (até 8 pessoas).

## Estrutura

- `index.html`: página principal, catálogo, quantidade, quiz, dados estruturados e integração WhatsApp/Apps Script.
- `deck.css` e `deck.js`: apresentação visual e navegação compartilhadas pelas apresentações HTML.
- `cultura-setur.html` e `cultura-setur.css`: apresentação executiva exclusiva para SETUR (`/setur`; endereço anterior preservado), dez slides principais e um apoio opcional de lançamento.
- `docs/roteiro-cultura-setur-2026-09.md`: roteiro, fontes e uso das notas da SETUR.
- `semep.html` e `semep.css`: apresentação para a conversa com Diego da SEMEP (`/semep`), oito slides.
- `docs/roteiro-semep-2026-10.md`: fala, pedidos e fontes da reunião com a SEMEP.
- `docs/plano-arquitetura-operacao-2026-09.md`: plano do futuro sistema com equipe própria; não representa backend implantado.
- `visao.html`: visão futura, com operação própria e experiências até 50 pessoas; não é oferta atual.
- `resumo-executivo.html`: apresentação institucional, alinhada à oferta e à visão.
- `parceria-pousadas.html`: proposta de parceria com hospedagens.
- `vercel.json`, `robots.txt`, `sitemap.xml`, `.vercelignore`: publicação e indexação.
- `docs/pacotes-v2.md`: estimativas e regras comerciais vigentes.
- `docs/revisao-experiencias-2026-09.md`: decisões, fontes e registro da retirada da expansão.
- `tests/`: validação estática e regressões dos fluxos no navegador; não é publicado.

## Desenvolvimento

```sh
python3 -m http.server 3000
node tests/static-checks.cjs
# Em outro terminal, com Playwright e seus navegadores instalados:
python3 tests/browser-checks.py
```

A branch `main` publica automaticamente no projeto Vercel `gustavo-s/descomplica-guaruja`. O domínio canônico é `https://www.descomplicaguaruja.com.br/`.

## Política de preço

A Dois: sempre 2 pessoas. As outras coleções: 2–8. Cards e quiz exibem estimativas totais para a quantidade escolhida, sem aumento proporcional automático. Valor final confirmado antes da reserva. Consulte `docs/precificacao-2026-09.md` para fontes, custos, premissas e limites; `docs/precificacao-2026-09.json` contém o cálculo por quantidade.

As páginas de cadastro de fornecedores, celebrações, painel e proposta foram retiradas. O banco antigo não é usado pelo site e seus dados não foram alterados nesta revisão.

## Regressões de apresentação e proposta

Com o servidor local ativo, executar `python3 tests/deck-scroll-checks.py` para testar os slides com animação normal e o ponteiro no canto da tela. `python3 tests/pilot-form-checks.py` verifica os campos da pousada, a mensagem de WhatsApp/e-mail e a recuperação do rascunho nesta aba, bloqueando chamadas externas.

O formulário da pousada prepara a mensagem; o usuário confirma o envio no aplicativo escolhido. Não grava automaticamente no banco ou no webhook do quiz. O QR code identifica o site. O rascunho usa sessionStorage da mesma aba.

Para validar a apresentação da SEMEP com servidor local ativo e navegadores Playwright instalados: `python3 tests/semep-checks.py`.

## Laboratório da home (outubro de 2026)

`/laboratorio-home` reúne quatro alternativas funcionais isoladas em `/prototipos/`, a avaliação e um simulador de custos. Usam o design system vigente, sem substituir a home. Valores ilustrativos, sem envio real de mensagens; páginas com `noindex`. Base proposta de 90 minutos, limitada a 2h30 de experiência do cliente conforme local; trabalho da equipe calculado separadamente.

Análise, fontes e premissas em `docs/avaliacao-home-2026-10.md`; sensibilidade em `docs/custos-home-2026-10.csv`. Com o servidor local na porta 3000 e Playwright com Chromium/WebKit instalados: `python3 tests/home-prototypes-checks.py`. `TEST_BROWSERS=chromium` permite selecionar apenas esse navegador; `TEST_BASE_URL` altera o servidor de teste.
