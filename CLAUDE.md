# Descomplica Guarujá — contexto vigente em 25/09/2026

## Produto e arquitetura

Experiências personalizadas no Guarujá. Manter site estático em HTML/CSS/JS nativo, sem framework e sem build. `index.html` contém o site e o quiz. Não usar o antigo formato da montagem como nome do produto: o cliente compra uma experiência.

## Regras comerciais aprovadas pelo Gustavo

- Coleções: A Dois, Celebrar, Entre Amigas, Pedido.
- A Dois é exclusivamente para 2 pessoas. Celebrar, Entre Amigas e Pedido: de 2 a 8 pessoas; em Pedido, o casal integra o total.
- Valores antigos foram substituídos por estimativas para cada quantidade, a pedido do usuário em 25/09/2026. Não são cotações fechadas nem margem comprovada. Não multiplicar proporcionalmente pelo número de participantes.
- Fonte de preços: `docs/precificacao-2026-09.json`; pesquisa e premissas em `docs/precificacao-2026-09.md`; escopo em `docs/pacotes-v2.md`. `PRICE_ESTIMATES` e `packageForGuests()` alimentam cards/quiz/WhatsApp.
- Mostrar faixa e total de participantes, confirmar valor antes da reserva. Montagem, desmontagem e transporte urbano incluídos. Locação, acessos especiais e extras à parte. Não reinserir desconto automático.
- Reserva: 50% via Pix, saldo até 72h antes. Manhã/tarde/pôr do sol/noite. Essencial 1h30, Completa 2h, Luxo 2h30; Pedido Luxo sob medida.

## Visão futura, separada da oferta atual

O negócio pretende organizar experiências próprias até 50 pessoas, chegando a 40–50 após validar operação. Casas de veraneio, pousadas e locais de locação, com surpresa personalizada criada a partir da história da família. A Descomplica seleciona e coordena os profissionais. Não é marketplace, não conecta o cliente diretamente ao fornecedor e não oferece Calendly.

A expansão só aparece na visão e no resumo executivo. Nunca oferecê-la para reserva na home. Não alegar que todo buffet exige 60 pessoas: há atendimento local de grupos menores, conforme fontes em `docs/revisao-experiencias-2026-09.md`.

## Apresentações

- `/parceria-pousadas`: proposta para pousadas/hotéis.
- `/resumo-executivo`: resumo institucional para leitura online.
- `/visao`: visão para interlocutores da Prefeitura do Guarujá e Sebrae, focada em turismo, negócios locais, mentoria e piloto. Preservar a discrição da apresentação; não citar autoridades nem atribuir apoios existentes.
- Não afirmar que a empresa já tem CNPJ/Cadastur sem comprovação atual.
- Todas usam `deck.css`/`deck.js`, mantêm o slide 1 sem hash e os demais em `#n`. Não mover o contêiner de fundo com o mouse: isso cria overflow nos slides. Fotos grandes mantêm o enquadramento completo. `noindex` em meta/header; o robots permite leitura para processamento do noindex.
- Antes de mudar animação/UI dos decks, ler as skills em `~/.claude/skills/{emil-design-eng,animate,apple-design}/SKILL.md`. Manter os tokens e suporte a movimento reduzido. Validar todos os slides visualmente.

## Design e instrumentação

Cream #F4EDE4, sand #E7D8C5, terracotta-ink #A35236, petrol #1F4E54, petrol-deep #143438. Fraunces/Jost/Allura, fontes locais. Preservar WebP/JPEG e fallback de imagens para Safari. Reveals nunca devem esconder a página sem JavaScript.
WhatsApp real: 5513988523663. GA4 e Meta Pixel já configurados no head. Preservar UTMs, webhook Apps Script, dataLayer e dados de quantidade/estimativa/sob-consulta.

## Infraestrutura e retirada da expansão

GitHub `ghcastellano/descomplica-guaruja`, main → Vercel `gustavo-s/descomplica-guaruja`, host www canônico. A revisão usa o escopo de produto do commit `938b532`, preservando correções técnicas posteriores. Páginas `celebracoes`, `parceiros`, `painel`, `proposta` e `app.css` removidos, junto de menus, aliases e referências públicas. Não restaurar.
O Supabase antigo é compartilhado com outro negócio; não excluir schemas, RPCs, usuários ou dados por causa da retirada das páginas. Não há integração Supabase no site vigente.
Arquivos de apoio, documentos privados e áudios não entram no deploy. Nunca fazer `git add .` sem revisar arquivos não rastreados.

## Verificação

Rodar `node tests/static-checks.cjs`. Testar cards e quiz de 2 a 8 pessoas, limites de A Dois, mudança/reinício de respostas, mensagens de WhatsApp, imagens, FAQ, navegação dos decks, responsividade e movimento reduzido. Antes de testar, interceptar analytics/webhook para não criar leads reais.

Na proposta para pousadas, os campos de espaço, data e formato preenchem WhatsApp e e-mail. O envio é confirmado pelo usuário no aplicativo. sessionStorage mantém o rascunho nesta aba; não há envio automático ao webhook do quiz. Testar com `tests/pilot-form-checks.py` e `tests/deck-scroll-checks.py`, incluindo movimento normal.
