# Uma home mais simples e uma operação viável

Estudo de 11/10/2026. Escopo: página inicial, oferta inicial e custo operacional de uma equipe de duas pessoas. Os quatro protótipos são alternativas para avaliação, não uma alteração da oferta comercial vigente. Não foram alterados o app, as apresentações ou os preços da home atual.

## Recomendação

Manter quatro **motivos** reconhecíveis (a dois, aniversário, pessoas queridas e pedido), retirar a escolha obrigatória entre Essencial/Completa/Luxo e entregar uma base de ambientação com um detalhe afetivo. Começar pela entrada da alternativa A e considerar o resumo editável da alternativa C. O questionário da B pode ser ajuda opcional; D merece teste com visitantes vindos de indicação que já sabem o que querem.

A quantidade de ocasiões não é, sozinha, o problema. O esforço está em entender as diferenças entre onze pacotes, responder ao quiz, comparar inclusões e ainda descobrir se o orçamento e o local comportam o pedido. Reduzir esse esforço não exige apagar a identificação emocional.

## O que observamos na home atual

- Quatro coleções e onze pacotes: três em A Dois, Celebrar e Entre Amigas; dois em Pedido. A quantidade acrescenta outras faixas de preço.
- Quiz com seis perguntas em A Dois e sete nas demais ocasiões. Parte das decisões pode ser discutida depois que o visitante entende a proposta básica.
- No código, quando nenhuma alternativa cabe no orçamento, a recomendação pode apresentar a opção mais barata, ainda acima do orçamento, com aviso. Isso não cria uma alternativa simples para aquele cliente.
- Pedido associa a entrada a fotografia/vídeo profissionais. Na planilha vigente, esses serviços representam R$ 750 na versão Assinatura e R$ 1.450 na superior. Um pedido simples não precisa herdar esse custo.
- Em 390 × 844 px, a home mediu aproximadamente 7.441 px de altura no navegador local. Comprimento é um sinal para investigar, não prova de abandono.
- Catálogo, quiz e WhatsApp competem como caminhos de decisão. A promessa de praia precisa encontrar cedo a explicação sobre ponto, acesso, clima e condições.

Não tivemos acesso a funil de conversão, gravações de uso, vendas por origem ou motivos reais de desistência. As fricções descritas são hipóteses sustentadas pela interface e pelo código; não são taxas de abandono medidas.

## Os quatro protótipos

| Opção | Caminho | Melhor hipótese de uso | Principal risco |
| --- | --- | --- | --- |
| A · Pelo motivo | Uma ocasião revela uma sugestão e seus ajustes | Visitante que se reconhece em uma intenção | Ocasiões podem se sobrepor: aniversário a dois, por exemplo |
| B · Três perguntas | Ocasião → pessoas → local → resumo | Visitante indeciso que prefere orientação | Etapas extras para quem já decidiu |
| C · Uma experiência | Base visível, ocasião e quantidade ajustáveis na mesma tela | Clareza de inclusões e comparação rápida | Pode parecer apenas decoração se perdermos o cuidado humano |
| D · Conversa direta | Três campos e comentário opcional → mensagem preparada | Indicação/Instagram com intenção definida | Mais atendimento manual para a dupla |

Todas usam os arquivos reais `design-system/tokens.css`, `fonts.css` e `components.css`, imagens do acervo e CSS adicional isolado. Os controles funcionam: escolher, voltar, alterar quantidade/local/detalhe, revisar e copiar o resumo. Não há disparo de WhatsApp, cadastro, webhook ou reserva real. Os estudos são públicos com `noindex`; isso não é controle de acesso.

## Operação proposta

Uma base: mesa baixa, almofadas, decoração do acervo, cartão, montagem e retirada. Mesmo roteiro, caixas organizadas e paleta disponível; sem criar um projeto diferente para cada ocasião. No começo, atender de dois a quatro participantes; cinco a oito exigem confirmação de equipe, acesso e orçamento. A Dois permanece exclusivo para duas pessoas.

| Motivo | Detalhe sugerido | Padronização necessária |
| --- | --- | --- |
| A Dois | Cartão com mensagem | Mesmo acervo e roteiro |
| Aniversário | Mini bolo opcional | Fornecedor, tamanho, transporte, conservação e restrições alimentares confirmados |
| Pessoas queridas | Cartão do grupo | Limite de lugares e uma disposição definida |
| Pedido | Buquê opcional | Tamanho e flores disponíveis, sem fotógrafo obrigatório |

**Limite confirmado pelo usuário: até 2h30 de experiência para o cliente.** Não é o limite do trabalho da equipe. Os protótipos simulam uma base de 90 minutos; uma extensão até o teto depende do local e de orçamento. Não presumir que uma hora extra de ocupação seja gratuita: ela pode consumir espera, deslocamentos e disponibilidade dos dois. Uma experiência de 2h30 com dois integrantes presentes já representa cinco horas-pessoa de presença, antes de qualquer preparação.

O usuário relata orientação da Prefeitura de que experiências simples precisariam da empresa e do alvará de funcionamento, sem um alvará específico para cada experiência. Relata também que a maioria dos lugares admite até 2h30. Registramos isso como orientação recebida por ele, não como autorização universal verificada documentalmente. Confirmar o ponto e a estrutura com o responsável evita prometer qualquer montagem em qualquer praia. O preço, por si só, não determina a necessidade de autorização.

Priorizar locais com acesso curto e repetível. Praia e pontos turísticos continuam disponíveis nos protótipos, acompanhados da confirmação do ponto exato. Casa, condomínio e hospedagem são alternativas concretas. Em chuva, combinar previamente alternativa coberta ou remarcação e seus termos.

## Preço: pagar o trabalho antes de chamar o restante de lucro

Não há dados suficientes para determinar hoje um preço aceito pelo mercado e rentável em todos os cenários. As faixas dos protótipos são hipóteses de interface:

- Base de duas pessoas: R$ 450–550.
- Três ou quatro pessoas: acréscimo ilustrativo de R$ 80–120 no total.
- Mini bolo: acréscimo de R$ 100–160; buquê: R$ 180–280, ambos opcionais.
- Sem refeição, bebidas, fotógrafo e locação. Transporte urbano básico considerado; acesso especial pode alterar o orçamento.

**Não são cotações de fornecedores nem preços aprovados.** O preço do bolo/buquê deve absorver compra, busca, perdas, impostos, pagamento e trabalho adicional. Um buquê vendido no varejo por R$ 210 não pode ser revendido pelo mesmo valor como se a operação não custasse nada.

O simulador reaproveita premissas de planejamento do material existente, explicitamente ajustáveis: remuneração de R$ 35/hora-pessoa, fixos de R$ 900/mês, reserva de 7% sobre custos, provisão de impostos de 10% da receita, pagamento de 1% e resultado operacional desejado de 15% depois de remunerar o trabalho. A alíquota real depende da atividade e do regime. No MEI, se elegível, incluir o DAS nos fixos e evitar somar indevidamente o mesmo imposto como percentual.

Fórmula: `(horas-pessoa × remuneração + custos diretos + fixos/vendas) × 1,07 / (1 − impostos − pagamento − resultado)`.

O cenário padrão tem 4,5 horas-pessoa, R$ 90 de outros custos e oito vendas por mês:

| Componente | Valor |
| --- | ---: |
| Trabalho dos sócios | R$ 157,50 |
| Transporte, limpeza, desgaste e decoração | R$ 90,00 |
| Fixos rateados | R$ 112,50 |
| Reserva de imprevistos | R$ 25,20 |
| Preço calculado | **R$ 520,54** |
| Impostos provisionados | R$ 52,05 |
| Pagamento | R$ 5,21 |
| Resultado operacional após trabalho | R$ 78,08 |

A meta de resultado é margem sobre receita, não um acréscimo de 15% sobre o custo. Não inclui retorno de investimento inicial nem qualquer gasto omitido. Os R$ 90 precisam ser substituídos por registros reais. Atendimento anterior à venda, compras, preparação, ida/volta, montagem, retirada, limpeza e espera indisponível devem entrar no tempo. Duas pessoas trabalhando uma hora representam duas horas-pessoa.

### Sensibilidade a volume e trabalho

Os valores completos estão em `custos-home-2026-10.csv`. Arredondamentos abaixo são apenas para leitura.

| Cenário hipotético | Horas-pessoa | Outros custos | 4 vendas/mês | 8 | 12 | 20 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Formato leve | 2,5 | R$ 60 | R$ 539 | R$ 376 | R$ 322 | R$ 278 |
| Base atendida | 4,5 | R$ 90 | R$ 683 | R$ 521 | R$ 466 | R$ 423 |
| Maior dedicação | 7,5 | R$ 90 | R$ 835 | R$ 672 | R$ 618 | R$ 575 |

Horas-pessoa são hipóteses de trabalho total, não durações contratadas. O formato leve de 2,5 horas-pessoa **não** pressupõe duas pessoas acompanhando 2h30 de experiência. Só faz sentido se a logística permitir pouca intervenção e se isso for seguro, combinado e operacionalmente comprovado.

A base a R$ 450 não sustenta a meta em vários cenários. A R$ 450, com os custos padrão e oito vendas, sobram R$ 15,30 após custos, reserva, imposto e pagamento, em vez dos R$ 67,50 necessários à meta de 15%. Com quatro vendas, o mesmo preço dá resultado negativo. O valor de R$ 521 é uma hipótese de equilíbrio com margem no cenário apresentado, não uma recomendação automática de preço psicológico.

### Uma entrada acessível precisa ser um produto mais leve

Testar um formato de retirada/devolução de kit ou montagem muito próxima e padronizada, com escopo claramente diferente: cliente participa da preparação, sem produção sob medida, sem permanência da dupla e sem perecíveis obrigatórios. Isso precisa de instruções, controle de itens, conservação e responsabilidade combinada. Não foi inserido como oferta confirmada nos protótipos.

R$ 379 pode ser uma hipótese de teste **somente** se o formato leve realmente consumir até 2,5 horas-pessoa, R$ 60 de outros custos e atingir aproximadamente oito vendas mensais com as demais premissas. Com quatro vendas o cálculo já vai a R$ 539. Um preço de R$ 199 para a mesma entrega completa não é sustentado por este modelo. Para baixar preço, reduzir trabalho/custo, compartilhar logística ou aumentar ocupação comprovada; não esconder remuneração dos sócios.

Antes de uma tabela definitiva: realizar ao menos três montagens cronometradas, separar trabalho individual e simultâneo, obter cotações de bolo/flor/transporte, contar desgaste, levantar fixos reais e simular baixa temporada. Comissões de parceiros, anúncios/CAC, estacionamento, taxas do local, cancelamentos, perdas e necessidade de armazenamento entram onde existirem. Investimento inicial e caixa de reposição merecem plano separado do resultado por experiência.

## Poder de compra e sazonalidade

O IBGE informa 287.634 habitantes no Censo 2022 e PIB per capita de R$ 40.107,77 em 2023. PIB per capita mede produção econômica, **não renda disponível**, e não serve para concluir quanto um morador pode gastar. Não encontramos nesta consulta uma medida verificada de renda disponível do público específico nem dados de disposição a pagar pelo serviço. Não há base para dizer que todo turista tem dinheiro ou que morador não compra experiências.

A Prefeitura publicou em 29/04/2026 previsão de cerca de 70% de ocupação hoteleira para o feriado de maio. Isso sugere picos sazonais; não é ocupação efetivamente realizada nem série anual de demanda. Não dimensionar fixos contando com vinte vendas todo mês apenas por haver turismo.

Separar os testes por contexto: moradores comemorando perto de casa, turistas em casal, famílias hospedadas e visitantes por indicação. Investigar orçamento total, ocasião, prazo e substitutos (restaurante, flores, decoração na hospedagem), sem perguntar apenas se a pessoa “gostou”. Uma entrada leve pode incentivar recorrência local; não assumir que isso acontecerá sem vendas.

## Cases e o que se aplica aqui

1. **Nielsen Norman Group — Progressive Disclosure.** Mostrar o essencial primeiro e revelar detalhes conforme necessários. Aplicação: ocasião primeiro, ajustes depois. Não confundir revelação progressiva com obrigar todos a percorrer um wizard.
2. **Baymard — Checkout Flow / Form Fields.** Esforço e quantidade de campos importam; contar telas isoladamente é insuficiente. Aplicação: não pedir cadastro ou dados pessoais antes de explicar a proposta. Pesquisa de checkout não comprova conversão deste negócio de serviços.
3. **Take a Chef.** Cliente expressa necessidades, recebe proposta e conversa antes de contratar; padronização de menus convive com ajustes. Aplicação: pedido curto seguido de proposta, sem copiar a complexidade de um marketplace.
4. **The Picnic Collective.** Uma base de experiência atende ocasiões diferentes, com adicionais; também distingue aluguel entregue com montagem pelo cliente de serviço completo. Aplicação: separar formato leve de formato atendido. Preços estrangeiros não foram convertidos em “preço local”.
5. **Villa di Roma, Guarujá.** Decoração anunciada por R$ 160, R$ 180 e R$ 220 conforme acomodação. São adicionais à diária/pernoite, não preço total de uma experiência externa com logística. É um substituto percebido pelo cliente, mas não uma referência equivalente de custo.
6. **Náutica Mar Azul.** Adicionais românticos anunciados por R$ 99, R$ 350 e R$ 650; excluem a locação da embarcação. Útil para distinguir preço do detalhe de preço total. Não usar R$ 99 como comparação de passeio completo.
7. **Inova Flores — Guarujá.** Exemplos de buquês no varejo em faixas como R$ 139, R$ 210 e R$ 259. Evidenciam a necessidade de cotar o detalhe; não são custo atacadista ou fornecedor contratado.

Nenhum case fornece garantia de aumento de conversão para a Descomplica. As fontes são públicas e preços podem mudar.

## Como escolher e validar

Fazer uma rodada qualitativa com 8–12 participantes misturando moradores e turistas: distribuir a ordem das alternativas para reduzir efeito de aprendizagem; pedir para organizar aniversário, encontro ou pedido dentro de um orçamento e explicar o que está incluso. Observar tempo até entender, erros de quantidade, expectativa de duração, entendimento do total e dúvidas antes de conversar. Essa amostra descobre problemas; não estima estatisticamente uma taxa de conversão.

Depois, escolher uma hipótese e medir sessões → início → resumo → conversa → proposta → venda, com consentimento e configuração apropriados. Registrar também minutos de atendimento por lead, margem após trabalho, perdas e retrabalho. A alternativa D só é melhor se reduzir atrito sem transferir trabalho demais para os dois sócios. Um teste A/B quantitativo depende de tráfego e planejamento de amostra; não declarar vencedor após poucas visitas.

## Fontes consultadas em 11/10/2026

- https://www.nngroup.com/articles/progressive-disclosure/
- https://baymard.com/blog/checkout-flow-average-form-fields
- https://www.takeachef.com/en-br
- https://helpcenter.takeachef.com/menu-options-and-pricing
- https://www.thepicniccollective.com/luxe-picnics
- https://hotelvilladiroma.com.br/decoracao/
- https://www.nauticamarazul.com/passeiosromanticos
- https://www.inovaflores.com.br/floricultura-online/guaruja/9182
- https://blog.rn.sebrae.com.br/precificacao/
- https://www.ibge.gov.br/cidades-e-estados/sp/guaruja.html
- https://www.guaruja.sp.gov.br/guaruja-espera-cerca-de-70-de-ocupacao-na-rede-hoteleira-durante-o-feriado
- https://www.guaruja.sp.gov.br/turismo
- Fontes internas: `index.html`, `docs/precificacao-2026-09.md` e `.json`; orientação municipal relatada pelo usuário.
