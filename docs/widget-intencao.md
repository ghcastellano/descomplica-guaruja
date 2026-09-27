# Concierge por intenção — homologação

A home responde ao texto com um widget na própria página. A tipografia, as cores, os controles e o catálogo são compartilhados com o design system do Descomplica. Não há redirecionamento para um formulário depois do prompt.

## Fluxo

1. O cliente descreve sua ideia (até 600 caracteres). Uma chamada explícita interpreta categoria, participantes, bairro/praia, data e período.
2. Um cartão apresenta a coleção e a estimativa do catálogo. As preferências extraídas aparecem como botões editáveis. A Dois continua exclusivo para duas pessoas; as demais coleções atendem de 2 a 8. Grupos fora da capacidade precisam ajustar a descrição, sem redução silenciosa do número de participantes.
3. O widget pergunta apenas os detalhes faltantes. Data e local já informados são preservados; os botões permitem revisá-los. Nome, contato e consentimento são pedidos por último.
4. Revisão explícita precede o registro no Neon. Confirmação e protocolo aparecem no mesmo lugar. O cliente decide quando abrir o acompanhamento.

Editar uma ideia mantém o texto original no compositor. Cancelar a edição preserva o formulário em andamento. Atualizar a descrição recalcula a sugestão. Repetir a mesma descrição durante essa visita usa um cache em memória de até cinco respostas. A descrição não é salva como histórico de IA nem em cache compartilhado entre clientes.

## OpenAI

- Modelo: `gpt-5.6-luna`, Responses API, `reasoning.effort=none`, JSON Schema estrito e saída limitada a 480 tokens.
- Escolha: extração e classificação curta, sem ferramentas, pesquisa web ou raciocínio longo. O teste com oito cenários em português acertou as expectativas dos oito, média de 1,7 segundo. Essa amostra é uma verificação inicial, não garantia de acerto universal.
- [Modelo e preço oficial](https://developers.openai.com/api/docs/models/gpt-5.6-luna): em 27/09/2026, US$ 0,20/M entrada e US$ 1,20/M saída. A estimativa interna usa US$ 0,25/M entrada para acomodar cache writes; não é uma fatura. Na amostra: 4.927 tokens de entrada e 333 de saída, estimativa conservadora de US$ 0,00164 pelos oito casos, aproximadamente US$ 2,04 para 10 mil interpretações com a mesma distribuição. Exclui infraestrutura, tributos e câmbio. O alias e a tabela de preços devem ser revisados ao alterar o modelo.
- Chave exclusivamente no servidor: `.env.local` ignorado pelo Git e variável **sensitive** no projeto `descomplica-guaruja-homolog`. Não existe `NEXT_PUBLIC_OPENAI_API_KEY`.
- Sem chamada ao abrir a página, digitar, clicar nos atalhos, escolher quantidade/data/local ou avançar. Os atalhos funcionam por regras, sem custo de IA.
- Timeout de 10 segundos para a OpenAI. Sem retry pago ou troca automática para um modelo mais caro. O navegador oferece o fluxo por regras se a requisição demorar ou falhar.

## Evolução do catálogo

A etapa de rede local passou a enviar 23 serviços específicos no contexto. O campo `serviceId` direciona duas perguntas de qualificação; o servidor valida a combinação serviço/categoria/vertical. A amostra de oito cenários acima precede essa ampliação. Um teste do catálogo ampliado usou 1.230 tokens de entrada e 51 de saída (~US$ 0,000369 conservadores), mantendo a mesma reserva e limites. Consulte `rede-profissionais.md`.

## Controle durável de custo

Migração `007_intent_ai.sql`, tabela `ai_interpretations` no Neon dedicado. Antes de chamar o provedor, uma transação curta reserva US$ 0,004 e registra UUID, hash derivado do IP, modelo e horário. Um advisory lock coordena as instâncias; a chamada OpenAI acontece fora da transação. Repetir o UUID não faz uma segunda chamada. Não são armazenados texto, resposta, telefone, e-mail ou IP bruto nessa tabela.

Defaults da homologação:

- `AI_DAILY_CALL_LIMIT=500`.
- `AI_DAILY_BUDGET_MICRO_USD=2000000` — US$ 2 de reservas por dia UTC.
- 12 interpretações por hora por hash de IP (a chave do hash inclui o dia UTC). Redes compartilhadas dividem esse limite; ao atingir o limite, a interface segue por escolhas, sem bloquear o pedido.
- Reserva é conservadora e não é devolvida em timeout, erro ou resposta inválida, pois o provedor pode ter processado a chamada.
- Tamanho máximo da requisição enviada: 12.000 bytes UTF-8, saída até 480 tokens. As reservas se baseiam no preço registrado acima; não representam um limite imposto à conta inteira da OpenAI, a outros apps ou a mudanças futuras de tarifa.
- Se o banco falhar ou qualquer limite for atingido, nenhuma chamada de IA é iniciada. `AI_ENABLED=false` desliga somente a interpretação por modelo.

A tabela registra tokens e estimativa de custo de respostas concluídas. Pedidos com `state=reserved` podem representar chamadas interrompidas ou resultado não confirmado. Não repetir automaticamente esses pedidos. Os testes pagos de avaliação são executados manualmente; não entram no ledger do tráfego do app.

## Fronteiras de segurança e privacidade

O modelo só transforma texto em campos conhecidos. Categorias são conferidas contra o catálogo, datas impossíveis/passadas são descartadas, e a capacidade é validada novamente ao criar o pedido. Preço, disponibilidade, aceite, reserva e pagamentos continuam determinísticos. Não há SQL gerado pelo modelo nem acesso a pedidos de outros clientes. O catálogo ainda é o arquivo estruturado público; o Neon mantém pedidos e operação, não um inventário público de prestadores pesquisável por IA.

Padrões comuns de telefone e e-mail são removidos antes de enviar a descrição. Essa redução não é anonimização completa. Campos posteriores de nome e contato não são enviados à OpenAI. `store=false` é solicitado, mas não equivale a retenção zero do provedor. A interface e `/privacidade` explicam o processamento e a alternativa sem IA.

A rota usa validação de origem, limite de payload, gate da homologação e `Cache-Control: no-store`. A identidade de rede usa `x-vercel-forwarded-for` definido pela Vercel; cabeçalhos arbitrários do cliente não controlam o limite global. Logs não incluem prompts, segredos nem corpos de erro do provedor.

## Validação

- `npm test`: 48 testes, incluindo orçamento concorrente, idempotência, rate limits, validação, respostas inválidas, fallback e contato removido. O runner remove a chave real e desliga IA; mocks não fazem chamadas pagas.
- `tests/intent-widget-checks.py`: fluxo sem IA, preço, confirmação, retry idempotente e mesma URL.
- `tests/intent-ai-browser-checks.py`: campos preenchidos, pular perguntas já respondidas, preservar dados ao cancelar edição, limite de pessoas e cache.
- Ambos em Chromium/WebKit e larguras 320, 390, 768 e 1440, sem chamadas pagas nem criação de pedidos reais.
- Build otimizado e inspeção da ausência da chave no bundle público.
- Após publicação: gate, endpoint real → OpenAI → validação → ledger no Neon, sem gerar lead, mensagem ou cobrança.

A configuração e a publicação são apenas no projeto separado de homologação. O site comercial permanece inalterado. WhatsApp automático e comunicação com clientes não fazem parte desta alteração.
