# CLAUDE.md — Descomplica Guarujá

## O que é este projeto
Landing page com quiz de recomendação para o **Descomplica Guarujá**: negócio de piqueniques de luxo e experiências montadas (até 4 pessoas) em Guarujá/SP. Funil: Instagram → site/quiz → WhatsApp → reserva com 50% via Pix. O dono é Gustavo (dev sênior, conhece Next.js/Vercel — pode ser técnico com ele).

## Stack e arquitetura (NÃO mudar sem pedir)
- **Um único `index.html` estático** — HTML + CSS + JS vanilla, zero dependências além do Google Fonts. Foi decisão deliberada: leve, sem build, deploy trivial. NÃO converter para Next.js/React/framework.
- Deploy alvo: **Vercel** (projeto estático).
- Imagens: Unsplash temporárias com fallback automático (`phErr()` troca por SVG local se falhar). Serão substituídas por fotos reais do "mock event" (8 fotos — ver TAREFAS.md).

## Apresentações (decks HTML, mesmo design system)
- `parceria-pousadas.html` (`/parceria-pousadas`; atalhos `/apresentacao`, `/parceria`, `/pousadas`): proposta para pousadas e hotéis, apresentada ao vivo (tem notas do apresentador).
- `resumo-executivo.html` (`/resumo-executivo`, atalho `/resumo`): resumo lido online por parceiros institucionais; foco em comércio local e no Guarujá querido por moradores e turistas de SP. NÃO citar prefeitura nem nomes de autoridades.
- `visao.html` (`/visao`, atalho `/futuro`): visão da plataforma (marketplace de prestadores locais, agenda integrada, organização de eventos). Mesma audiência do resumo.
- CSS e JS compartilhados: `deck.css` e `deck.js`. Curvas de easing orgânicas (cubic-bezier, sem linear, sem overshoot), cards flutuam no hover, transições longas. Não reintroduzir `--ease-back` com overshoot.
- Todos com `noindex` e bloqueados no `robots.txt`. Host canônico do site: **www.descomplicaguaruja.com.br** (apex redireciona 308 no painel da Vercel).

## Configuração obrigatória antes do deploy
No topo do `<script>` principal do `index.html`:
- `WHATSAPP_NUMBER` — trocar o placeholder `5513999999999` pelo número real (DDI+DDD+número, só dígitos). **Perguntar ao Gustavo.**
- `WEBHOOK_URL` — URL do Apps Script (código em `docs/webhook-quiz-sheets.gs`, instruções no cabeçalho do arquivo). Opcional no primeiro deploy; site funciona sem.

## Design system (tokens já implementados no CSS — manter fielmente)
- Paleta: cream `#F4EDE4` · sand `#E7D8C5` · terracotta `#C8765A` (só fundos/bordas/hover) · terracotta-ink `#A35236` (terracota em TEXTO: 4.7:1 sobre creme) · gold `#C9A24B` · petrol `#1F4E54` · petrol-deep `#143438` · ink `#2B2B2B` · muted `#6B655E` (4.9:1 sobre creme; o antigo `#7A736B` dava 4.0) · whatsapp `#25D366`
- Fontes: **Fraunces** (títulos serif) · **Jost** (corpo/UI) · **Allura** (script, SÓ para "Guarujá")
- Espaçamento escala 8px · raios 8/16/24 (botões 12) · touch targets ≥48px · contraste ≥4.5:1
- Estética: minimalismo praiano premium, texto à esquerda, muito respiro, NADA de visual de template (sem gradientes roxos, sem sombras pesadas, sem emojis em títulos)
- Animações: reveals leves via IntersectionObserver, gated por `html.js` (se o JS falhar, a página NUNCA fica em branco — manter esse mecanismo)

## Regras de negócio (fonte da verdade: docs/pacotes-v2.md — NÃO alterar preços/nomes sem aprovação explícita)
- 4 coleções: **A Dois** · **Celebrar** · **Entre Amigas** · **Pedido**
- 3 tiers uniformes: **Essencial · Completa · Luxo** (decisão baseada em evidência — não renomear)
- Durações: Essencial 1h30 · Completa 2h · Luxo 2h30 · hora extra R$ 120
- Teto de **4 pessoas** em tudo; grupos 5+ → combo de 2 montagens
- Preços: A Dois 249/329 · 699 · 1.290 | Celebrar e Amigas 549 · 890 · 1.690 | Pedido 1.490 · 2.990+
- Pôr do sol é **slot de horário** (⭐ mais procurado), nunca nome de pacote
- Tagline: "Você vive o momento. A gente cuida dos detalhes."

## Instrumentação (manter e estender)
- Eventos via `track()` → `window.dataLayer` (GA4/GTM-ready) + POST opcional ao webhook: `page_view`, `quiz_start`, `quiz_question`, `quiz_complete`, `whatsapp_click` (com source/pkg), `collection_open`
- UTMs capturadas da URL e anexadas a todo evento
- GA4 e Meta Pixel: snippets ainda NÃO instalados — há comentário no código indicando onde colar quando Gustavo criar as contas

## Validação após QUALQUER edição no index.html
```bash
node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m,i)=>{try{new Function(m[1]);console.log('✓ script',i+1,'OK')}catch(e){console.log('✗',e.message);process.exit(1)}})"
```
⚠️ Bug histórico: NUNCA declarar variáveis globais com nomes reservados do window (`top`, `name`, `status`, `open`...). Já quebrou a página uma vez.

## Armadilhas conhecidas
- A linha "5/6 perguntas" do quiz deve bater com `QUESTIONS.length` (hoje: 6)
- Badge "Mais escolhido" fica no tier Completa (decisão pendente de validação com vendas reais — não mover sem pedir)
- Textos nunca devem usar a palavra "simples" para descrever o Essencial
- Capacidades nos cards: "até 2 pessoas" (A Dois) / "até 4 pessoas|amigas" — não reintroduzir 6/10

## O que fazer
Siga `TAREFAS.md` em ordem. Pergunte antes de qualquer decisão de produto (preço, naming, estrutura); execute direto decisões puramente técnicas.
