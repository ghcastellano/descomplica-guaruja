# TAREFAS.md — Do zero ao ar na Vercel

> Executar em ordem. ⚙️ = técnica (executar direto) · ❓ = precisa de input do Gustavo

## Fase 1 — Setup
- [ ] ⚙️ `git init` + primeiro commit ("chore: projeto inicial Descomplica Guarujá")
- [ ] ⚙️ Validar sintaxe dos scripts do index.html (comando no CLAUDE.md)
- [ ] ⚙️ Servir localmente (`python3 -m http.server 3000`) e smoke test: hero renderiza, coleções expandem, quiz completa as 6 perguntas, botão WhatsApp gera link `wa.me`

## Fase 2 — Configuração
- [ ] ❓ Pedir o número de WhatsApp comercial → substituir `WHATSAPP_NUMBER`
- [ ] ❓ Perguntar se a planilha do webhook já foi criada (instruções em `docs/webhook-quiz-sheets.gs`) → se sim, colar URL em `WEBHOOK_URL`; se não, seguir sem (campo vazio = não envia, sem erro)

## Fase 3 — Melhorias pré-deploy
- [ ] ⚙️ Adicionar meta tags Open Graph + Twitter Card no `<head>` (título: "Descomplica Guarujá — Experiências à beira-mar"; descrição = meta description existente; `og:image` apontando para `/og-image.png`)
- [ ] ⚙️ Gerar `og-image.png` 1200×630: fundo cream #F4EDE4, ícone do logo (copiar o SVG inline do topo do index.html), wordmark "DESCOMPLICA Guarujá" e a tagline — pode renderizar via node-canvas, sharp (SVG→PNG) ou Playwright screenshot de um HTML temporário
- [ ] ⚙️ Extrair o favicon SVG inline para arquivo `favicon.svg` e referenciar (mantém o data-URI como fallback se preferir)
- [ ] ⚙️ Criar `robots.txt` (allow all) — landing única, sem sitemap necessário
- [ ] ⚙️ Lighthouse local: alvo ≥90 em Performance e Accessibility mobile; corrigir o que aparecer SEM mudar design

## Fase 4 — Deploy
- [ ] ⚙️ Conferir `vercel.json` (já incluído: cleanUrls)
- [ ] ❓ `npx vercel login` (Gustavo autentica no browser)
- [ ] ⚙️ `npx vercel` (preview) → enviar URL para Gustavo testar NO CELULAR
- [ ] ❓ Aprovado? → `npx vercel --prod`
- [ ] ❓ Domínio: Gustavo registra no registro.br (~R$ 40/ano) → adicionar no painel Vercel (Settings > Domains) → configurar DNS conforme instruções da Vercel (apontar A/CNAME)

## Fase 5 — Pós-deploy (validação do funil)
- [ ] ❓ Testar no celular real: quiz completo → WhatsApp abre com a mensagem certa
- [ ] ⚙️ Abrir console em produção e confirmar eventos no `window.dataLayer` (quiz_start, quiz_complete, whatsapp_click)
- [ ] ❓ Se webhook configurado: completar 1 quiz e conferir a linha na planilha
- [ ] ❓ Quando Gustavo criar GA4 + Meta Pixel: colar os snippets oficiais no `<head>` (local indicado por comentário no código) e redeployar

## Fase 6 — Quando chegarem os assets reais (futuro)
- [ ] ❓ **8 fotos do mock event** (shotlist em `docs/kit-copy-lancamento-v1.md` §5) → substituir as URLs do Unsplash: hero (foto #6), cards A Dois/Celebrar/Amigas/Pedido (#7/#1/#2/#8), galeria (#10/#3/#9) + as mesmas nos `PKGS` do quiz. Remover o aviso "imagens de referência" da seção Momentos.
- [ ] ❓ **Logo final em SVG** → substituir nos 3 pontos: favicon, `.brand` do topo, `.hero-seal` (e regenerar og-image)
- [ ] ⚙️ Após cada troca: validar sintaxe + commit + `npx vercel --prod`

## Regras de commit
Conventional commits em PT: `feat:`, `fix:`, `chore:`, `content:`. Um commit por tarefa concluída.
