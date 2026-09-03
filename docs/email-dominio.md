# E-mail do domínio — ola@descomplicaguaruja.com.br

> Endereço escolhido: **ola@descomplicaguaruja.com.br** (acolhedor, curto, fácil de ditar). Já está no rodapé do site, no JSON-LD e no slide final da apresentação.
> Situação em 03/09/2026: o endereço ainda **não recebe** mensagens. Falta vincular o domínio a um plano de e-mail e criar os registros DNS no registro.br.

## Onde está cada coisa

| Item | Onde | Observação |
|---|---|---|
| Domínio `descomplicaguaruja.com.br` | registro.br | DNS também no registro.br (`a.sec.dns.br` / `c.sec.dns.br`) |
| Site | Vercel | registro A → `216.150.1.1` (Vercel) |
| MX (e-mail) | nenhum | por isso nada chega ainda |
| Plano de e-mail | Hostinger | **3 planos "Starter Business Email" já pagos** na conta (R$ 95,88/ano cada). Um deles (`OR3cb1978a06edac2246e3f1003e5a`) está **sem domínio vinculado** (`pending_setup`) |

## Recomendação: custo zero, usar o plano Hostinger que já está pago

O plano Starter Business Email inclui até 1.000 caixas, 5 GB por caixa, IMAP/POP3, webmail, 100 aliases e encaminhamento. Sobra para um e-mail de contato.

### Passo a passo (5 minutos, precisa do painel Hostinger e do registro.br)

1. **hPanel Hostinger → E-mails** → no plano marcado como "Configurar" (o que está sem domínio) → digitar `descomplicaguaruja.com.br` → Continuar.
2. A Hostinger vai mostrar os registros DNS. Como o DNS está no registro.br (não na Hostinger), escolher "Configurar manualmente" e copiar os registros. Em geral são estes:

   | Tipo | Nome | Valor | Prioridade |
   |---|---|---|---|
   | MX | @ | `mx1.hostinger.com` | 5 |
   | MX | @ | `mx2.hostinger.com` | 10 |
   | TXT | @ | `v=spf1 include:_spf.mail.hostinger.com ~all` | — |
   | CNAME | `hostingermail-a._domainkey` | `hostingermail-a.dkim.mail.hostinger.com` | — |
   | CNAME | `hostingermail-b._domainkey` | `hostingermail-b.dkim.mail.hostinger.com` | — |
   | CNAME | `hostingermail-c._domainkey` | `hostingermail-c.dkim.mail.hostinger.com` | — |

   Conferir sempre com os valores exibidos no painel: eles são a fonte da verdade.
3. **registro.br → Painel → domínio → DNS → Editar zona** → adicionar os registros acima. Não mexer no registro A (site) nem no TXT `google-site-verification`.
4. Aguardar propagação (15 min a algumas horas). No hPanel, clicar em "Verificar".
5. Criar a caixa `ola` (o Claude faz pela API assim que o domínio estiver vinculado, ou: hPanel → E-mails → Criar conta de e-mail → `ola` + senha).
6. Opcional, recomendado: em **Encaminhamentos**, mandar cópia de tudo que chegar em `ola@` para `ghcastellano@gmail.com` e para o e-mail da Sophia. Assim ninguém precisa abrir o webmail.
7. Opcional: no Gmail, "Enviar e-mail como" `ola@descomplicaguaruja.com.br` (SMTP `smtp.hostinger.com`, porta 465, usuário = o e-mail completo) para responder a partir do Gmail com o endereço do Descomplica.

## Alternativas (se não quiser usar o plano Hostinger)

| Opção | Custo | Prós | Contras |
|---|---|---|---|
| **Hostinger Starter (já pago)** | R$ 0 extra (renova a R$ 95,88/ano) | Já contratado, webmail + IMAP, suporte em português | DNS manual no registro.br |
| Hostinger Starter novo | R$ 41,88 no 1º ano (R$ 3,49/mês), depois R$ 95,88/ano | Barato | Não faz sentido: já existe plano pago |
| Zoho Mail Lite | ~R$ 5/mês por usuário (~R$ 60/ano) | Bom webmail e app | Plano gratuito com domínio próprio foi descontinuado |
| Google Workspace Starter | ~R$ 28/mês (~R$ 336/ano) | Integração total com Gmail/Drive | Caro para um único e-mail de contato |
| Só encaminhamento (ex.: ImprovMX) | R$ 0 | Recebe em `ola@` e cai no Gmail | Não envia com o domínio sem configuração extra; dependência de serviço de terceiros |

## Depois que estiver ativo

- Testar: enviar de um Gmail para `ola@descomplicaguaruja.com.br` e confirmar chegada (webmail ou encaminhamento).
- Adicionar o e-mail na bio do Instagram e no Google Business Profile.
- O link `mailto:` do site já abre com o assunto "Olá, Descomplica Guarujá" preenchido.
