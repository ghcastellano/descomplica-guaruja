# Descomplica Guarujá — Landing + Quiz

Piqueniques de luxo e experiências montadas no Guarujá/SP. Landing estática (HTML único) com quiz de recomendação → WhatsApp.

## Começando (no Claude Code)
> Leia o **CLAUDE.md** (contexto e regras) e execute o **TAREFAS.md** em ordem.

## Estrutura
- `index.html` — o site inteiro (HTML+CSS+JS vanilla, sem build)
- `vercel.json` — config mínima de deploy
- `docs/pacotes-v2.md` — fonte da verdade de preços/pacotes
- `docs/kit-copy-lancamento-v1.md` — bio, Reels, ManyChat, WhatsApp, shotlist
- `docs/lista-compras-kits-v1.md` — compras dos kits físicos
- `docs/webhook-quiz-sheets.gs` — Apps Script: quiz → Google Sheets

## Comandos
```bash
python3 -m http.server 3000   # rodar local
npx vercel                    # deploy preview
npx vercel --prod             # deploy produção
```
