# Descomplica Guarujá — Experiências e quiz

Site estático em HTML, CSS e JavaScript nativo, sem framework e sem build. Oferece A Dois (2 pessoas) e Celebrar, Entre Amigas e Pedido (até 8 pessoas).

## Estrutura

- `index.html`: página principal, catálogo, quantidade, quiz, dados estruturados e integração WhatsApp/Apps Script.
- `deck.css` e `deck.js`: apresentação visual e navegação compartilhadas pelas três apresentações HTML.
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
