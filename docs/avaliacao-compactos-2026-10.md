# Comparação e revisão dos dois compactos

11/10/2026. Referências: `compacto-1-tabs-ficha.html` e `compacto-3-linha-unica.html`, anexados pelo usuário. Novas páginas isoladas: `/prototipos/compacto-tabs` e `/prototipos/compacto-linha`. Não substituem a home nem os estudos anteriores.

## Recomendação

Preferir **abas + ficha** para a página principal: a foto, o detalhe da ocasião e a configuração têm uma relação clara. O visitante entende o cuidado que está comprando antes de comparar valores. Usar **linha única** como hipótese para visitantes vindos de indicação ou de um conteúdo específico, que já entendem o serviço e querem ajustar o pedido rapidamente. É uma recomendação de design, não um resultado de teste de conversão.

Compactar não significa reduzir todos os tamanhos ou colocar tudo em uma linha. Ambas as opções precisam preservar hierarquia, áreas de toque, legibilidade de preços e o significado da experiência. A linha única foi mantida como uma sequência de linhas organizadas; em telas menores ela se reorganiza para leitura vertical, sem rolagem horizontal.

## Problemas encontrados nos arquivos

- Adicional de uma hora leva a três horas, embora o FAQ prometa máximo de 2h30 e esse teto tenha sido definido pelo usuário.
- O total e a mensagem mantêm duas horas mesmo após selecionar extensão.
- Trocar de ocasião limpa todos os adicionais, obrigando a repetir escolhas.
- O clique mostra “Proposta registrada” e promete resposta em uma hora, mesmo quando `WEBHOOK_URL` está vazio. Abrir o WhatsApp não comprova envio ou recebimento.
- Telefone de WhatsApp fictício, nomes e datas sem rótulo persistente; data como texto livre e campos pessoais antes da decisão principal.
- O texto “comida e bebida por nossa conta” pode sugerir inclusão, embora esses itens sejam adicionais pagos.
- Controles de extras com 40–42px e `white-space:nowrap` podem apertar ou transbordar no celular. Os estados de vários botões não são expostos de forma acessível.
- Balões já integram aniversário, mas podem ser comprados novamente como adicional.
- “Pôr do sol, o mais pedido”, fornecedores licenciados e entrega das fotos em 48h aparecem sem comprovação no contexto. Não foram mantidos como promessas nos estudos revisados.
- Há funções duplicadas e redefinidas no mesmo script. As revisões usam uma implementação compartilhada entre os dois layouts, reduzindo divergências de soma e regras.

## Alterações aplicadas

| Tema | Abas + ficha | Linha única |
| --- | --- | --- |
| Desktop | Ocasiões no topo; foto e história ao lado dos controles | Configuração em linhas; contexto visual compacto |
| Tablet | Duas colunas adaptadas entre 700 e 1023px | Linhas com espaço para rótulos e opções |
| Celular | Ocasiões em grade 2×2; imagem pequena; ficha vertical | Grade 2×2 e linhas empilhadas, sem texto espremido |
| Contato | Revisão antes do WhatsApp; nome e data opcionais nesse momento | Mesmo fluxo e regras |

Nas duas: comida e bebida ficam à vista por sua relação com a regra de consumo; extras menos frequentes abrem sob demanda. O valor, participantes, duração e botão de revisão ficam na barra inferior. O diálogo esconde a barra para não disputar ações; Escape e Voltar restauram a configuração. Inputs usam 16px e altura de pelo menos 48px; botões de seleção têm pelo menos 44px; há foco visível, rótulos, checkboxes nativos, indicação `aria-pressed` e navegação por setas nos grupos. As escolhas de ocasião são botões de seleção visualmente semelhantes a abas, não um tablist ARIA incompleto.

Trocar de ocasião preserva os adicionais compatíveis. A quantidade é limitada ao novo formato e a mudança é anunciada. Balões saem dos extras no aniversário porque já estão incluídos. A revisão é montada com texto seguro, sem interpretar nome como HTML. Nome e data ficam em memória, não são enviados a webhook, analytics ou armazenamento local.

## Oferta e limites do estudo

Mantidos os valores-base dos anexos: A Dois e Entre Amigas R$ 349, aniversário R$ 399, Pedido R$ 549; R$ 79 por participante além de dois nos formatos que admitem quatro. Mantidos os novos adicionais dos anexos, incluindo bebidas R$ 49, registro fotográfico R$ 149 e drone R$ 199. Isso não altera a oferta comercial em produção nem valida margem.

A extensão de três horas foi retirada. O adicional agora é **30 minutos**, até **2h30**, usando **R$ 59 do protótipo anterior enviado pelo usuário**. Não foi feita uma divisão arbitrária do preço de uma hora. Todos os valores continuam identificados como simulação.

Drone depende de viabilidade e permissões do local; fotografia depende de disponibilidade e prazo combinado. Não se promete entrega em 48h. A regra sobre não levar consumo próprio é preservada; a proposta discrimina itens de consumo incluídos e adicionados. A data e o local são confirmados no atendimento, sem exigir seleção de ambos antecipadamente.

O período começa em “A combinar” para não atribuir ao visitante uma preferência que ele não escolheu. O link `?ocasiao=pedido&utm_source=instagram` pré-seleciona Pedido; só UTMs conhecidas entram no resumo. Usado o telefone de atendimento já configurado no site. O link abre uma mensagem marcada como simulação; não envia nada automaticamente. Não há confirmação falsa de registro, reserva ou entrega de e-mail.

## Validação e próximos passos

Testes funcionais em Chromium e WebKit, em 320×700, 390×844, 768×1024, 820×1180, 1024×768, 1440×900 e 844×390. Verificam soma, limites, duração, preservação de adicionais, ausência de cobrança duplicada, texto do WhatsApp, navegação por teclado, diálogo, áreas de toque, overflow e ausência de tráfego externo.

Comparar com pessoas reais antes de escolher a home: pedir para organizar um aniversário com quatro pessoas, adicionar bebidas e revisar a proposta. Observar entendimento das inclusões, erros, perda de contexto e dúvidas; não medir apenas cliques ou rolagem. A ficha deve transmitir melhor o serviço, e a linha deve facilitar alteração rápida, mas isso precisa ser validado com o público.
