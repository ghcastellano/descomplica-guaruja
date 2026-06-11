# Recomendações futuras — Descomplica Guarujá

> Geradas a partir de pesquisa multi-fonte (LGPD, benchmarks de quiz funnel, WhatsApp LATAM, lead response time).
> Revisar antes de cada sprint de melhoria.

---

## ✅ Já implementado
- Campo opcional de WhatsApp + horário preferido na tela de resultado do quiz (webhook → planilha)
- SEO técnico: canonical, JSON-LD LocalBusiness + FAQPage, sitemap, meta tags

---

## 🔜 Próximos passos (ordenados por impacto)

### 1. Velocidade de resposta — MAIOR alavanca de conversão
> "Leads contatados em 5 min têm 21x mais chance de fechar vs 30 min" (MIT/InsideSales)
> 63% das empresas nunca respondem. Ser rápido já é diferencial.

- **Regra operacional**: qualquer WhatsApp que chegar (quiz ou campo opcional) — responder em minutos, não horas.
- Janelas de maior conversão: **8–9h e 16–17h**, quarta e quinta.
- Leads que chegam à noite/fds (40%+ do tráfego de Reels): o campo "melhor horário" comprou permissão — chamar na manhã seguinte cedo.
- Futuro: avaliar bot de boas-vindas automático no WhatsApp Business para resposta em <30s fora do horário.

### 2. Google Search Console + Google Business Profile
- Quando o domínio próprio entrar: cadastrar no Search Console e submeter sitemap.
- Criar perfil no Google Business Profile ("piquenique guarujá" no Maps) — gratuito, alto impacto em buscas locais.
- Me chamar para atualizar canonical/og/sitemap para o domínio novo.

### 3. Meta Pixel + públicos de remarketing
- Assim que o Pixel estiver instalado: criar público personalizado de "completou o quiz mas não clicou no WhatsApp" → anúncio de retargeting com prova social ou oferta de fundação.
- Criar público lookalike dos que clicaram no WhatsApp — melhora ROI dos Reels.

### 4. Fotos reais (Fase 6 do TAREFAS.md)
- 8 fotos do mock event substituem as do Unsplash e removem o aviso "imagens de referência".
- Hero: foto #6 (A Dois vertical 4:5, golden hour) — maior impacto visual.
- Shotlist completa: docs/kit-copy-lancamento-v1.md §5.
- Logo final: Recraft (plano pago) → Figma. Prompts prontos em kit-copy-lancamento-v1.md §6.
- Quando enviar: eu troco as 8 URLs, substituo o logo em 3 pontos, regenero og-image, commito e publico.

### 5. E-mail vs WhatsApp no campo de captura (teste futuro)
- Pesquisa confirma: e-mail não vale para ticket médio/alto com decisão rápida em mercado WhatsApp-dominante.
- Se quiser testar e-mail no futuro: avaliar apenas como canal de nutrição (sequência automática pós-quiz), não como substituto do WhatsApp no funil principal.
- Uplift estimado do campo opcional: +10–25% de leads totais sem canibalizar clique direto.

### 6. LGPD — checklist de compliance (quando escalar)
- Campo desmarcado/vazio por padrão ✅ (já implementado)
- Finalidade explícita ao lado do campo ✅ (já implementado)
- Timestamp gravado no webhook ✅ (já implementado)
- Opt-out fácil nas mensagens proativas: instruir o cliente a responder "SAIR" para parar contatos.
- Se escalar para automação/CRM: documentar o teste de balanceamento de legítimo interesse (ANPD, 2024).

### 7. Click-to-WhatsApp Ads (quando tiver verba de mídia)
- CTWA direto do Instagram para WhatsApp converte até 3x mais que tráfego para landing page (Meta/vendors — direcional).
- Custo por lead até 40–70% menor que campanha para web form.
- Pré-requisito: Pixel instalado + histórico de eventos para otimização.

---

## 📌 Referências das fontes
- Interact: 80M+ leads, taxa de conclusão 65% geral / 47% Service Providers
- MIT/InsideSales (Dr. James Oldroyd): lead response time — estudo original ~2007–2011, amplamente citado
- RevenueHero 2024: tempo médio de resposta 29h+, 63% nunca respondem
- Blazeo 2026: 40%+ de consultas de alta intenção chegam fora do horário comercial
- ANPD (fev/2024): Guia de Legítimo Interesse — hipóteses legais LGPD
- Meta / vendors LATAM: WhatsApp penetração 70%+ adultos no Brasil
