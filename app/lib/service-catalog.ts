export type Service = {
  id: string;
  name: string;
  vertical: "resolver" | "casa";
  category: string;
  questions: readonly [string, string];
};
export const services: readonly Service[] = [
  {
    id: "limpeza-residencial",
    name: "Limpeza residencial",
    vertical: "resolver",
    category: "Limpeza",
    questions: [
      "Quantos cômodos precisam de limpeza?",
      "É manutenção do dia a dia ou limpeza pesada?",
    ],
  },
  {
    id: "limpeza-pos-obra",
    name: "Limpeza após obra",
    vertical: "resolver",
    category: "Limpeza",
    questions: [
      "Qual a área aproximada e o que foi reformado?",
      "Há entulho ou resíduos que precisam ser retirados?",
    ],
  },
  {
    id: "higienizacao-estofados",
    name: "Higienização de estofados",
    vertical: "resolver",
    category: "Limpeza",
    questions: [
      "Quais peças e quantos lugares precisam de limpeza?",
      "Há manchas, odores ou algum tecido especial?",
    ],
  },
  {
    id: "limpeza-vidros",
    name: "Limpeza de vidros",
    vertical: "resolver",
    category: "Limpeza",
    questions: [
      "Quantas janelas ou portas precisam de limpeza?",
      "É possível acessar os vidros com segurança pelo chão?",
    ],
  },
  {
    id: "eletrica-diagnostico",
    name: "Avaliação de problema elétrico",
    vertical: "resolver",
    category: "Elétrica",
    questions: [
      "O que parou de funcionar e quando começou?",
      "Há cheiro de queimado, faíscas ou disjuntor desarmando?",
    ],
  },
  {
    id: "tomadas-interruptores",
    name: "Troca de tomadas e interruptores",
    vertical: "resolver",
    category: "Elétrica",
    questions: [
      "Quantos pontos e o que precisa mudar?",
      "As peças já foram compradas?",
    ],
  },
  {
    id: "luminarias",
    name: "Instalação de luminárias",
    vertical: "resolver",
    category: "Elétrica",
    questions: [
      "Quantas luminárias e qual a altura do teto?",
      "Já existem pontos elétricos nos locais?",
    ],
  },
  {
    id: "chuveiro",
    name: "Instalação de chuveiro",
    vertical: "resolver",
    category: "Elétrica",
    questions: [
      "É troca de um chuveiro existente ou instalação nova?",
      "Qual o modelo e a tensão, se souber?",
    ],
  },
  {
    id: "torneira",
    name: "Reparo ou troca de torneira",
    vertical: "resolver",
    category: "Hidráulica",
    questions: [
      "Em qual ambiente e o que acontece com a torneira?",
      "É reparo ou você já tem uma peça para substituir?",
    ],
  },
  {
    id: "vazamento",
    name: "Avaliação de vazamento",
    vertical: "resolver",
    category: "Hidráulica",
    questions: [
      "Onde aparece a água e desde quando?",
      "O local da tubulação é acessível ou está dentro da parede?",
    ],
  },
  {
    id: "descarga",
    name: "Reparo de descarga",
    vertical: "resolver",
    category: "Hidráulica",
    questions: [
      "É caixa acoplada ou válvula na parede?",
      "O que acontece ao acionar a descarga?",
    ],
  },
  {
    id: "desentupimento",
    name: "Desentupimento",
    vertical: "resolver",
    category: "Hidráulica",
    questions: [
      "Qual ponto está entupido?",
      "A água retorna por outros ralos ou pontos?",
    ],
  },
  {
    id: "ar-limpeza",
    name: "Limpeza de ar-condicionado",
    vertical: "resolver",
    category: "Ar-condicionado",
    questions: [
      "Quantos aparelhos e de quais tipos?",
      "As unidades são acessíveis e quando foi a última limpeza?",
    ],
  },
  {
    id: "ar-diagnostico",
    name: "Avaliação de ar-condicionado",
    vertical: "resolver",
    category: "Ar-condicionado",
    questions: [
      "Qual a marca/modelo e o que está acontecendo?",
      "Há código de erro, ruído ou vazamento?",
    ],
  },
  {
    id: "ar-instalacao",
    name: "Instalação de ar-condicionado",
    vertical: "resolver",
    category: "Ar-condicionado",
    questions: [
      "Qual o modelo e a capacidade do aparelho?",
      "O imóvel já tem infraestrutura e autorização para instalar?",
    ],
  },
  {
    id: "montagem-moveis",
    name: "Montagem de móveis",
    vertical: "resolver",
    category: "Pequenos reparos",
    questions: [
      "Quais móveis e quantas peças?",
      "São novos com manual ou móveis já utilizados?",
    ],
  },
  {
    id: "fixacoes",
    name: "Instalação de prateleiras e suportes",
    vertical: "resolver",
    category: "Pequenos reparos",
    questions: [
      "O que será fixado e em quantos pontos?",
      "Você sabe o material da parede e tem as peças?",
    ],
  },
  {
    id: "pintura",
    name: "Pequenos serviços de pintura",
    vertical: "resolver",
    category: "Pequenos reparos",
    questions: [
      "Quais ambientes ou superfícies e área aproximada?",
      "Há mofo, infiltração ou reparos antes da pintura?",
    ],
  },
  {
    id: "portas-fechaduras",
    name: "Ajuste de portas e fechaduras",
    vertical: "resolver",
    category: "Pequenos reparos",
    questions: [
      "Qual o tipo de porta e qual o problema?",
      "É ajuste ou troca de alguma peça?",
    ],
  },
  {
    id: "casa-chegada",
    name: "Preparação da casa para chegada",
    vertical: "casa",
    category: "Preparar minha chegada",
    questions: [
      "O que precisa estar pronto para sua chegada?",
      "Como a equipe poderá acessar o imóvel?",
    ],
  },
  {
    id: "casa-limpeza",
    name: "Limpeza entre estadias",
    vertical: "casa",
    category: "Limpeza da casa",
    questions: [
      "Quantos quartos e banheiros tem o imóvel?",
      "É preciso cuidar de roupas de cama ou reposição de itens?",
    ],
  },
  {
    id: "casa-vistoria",
    name: "Conferência visual do imóvel",
    vertical: "casa",
    category: "Vistoria do imóvel",
    questions: [
      "O que você gostaria que fosse conferido?",
      "Como será autorizado o acesso ao imóvel?",
    ],
  },
  {
    id: "casa-manutencao",
    name: "Organização de manutenção do imóvel",
    vertical: "casa",
    category: "Manutenção",
    questions: [
      "Quais cuidados ou reparos são necessários?",
      "Há alguém no imóvel ou precisamos combinar o acesso?",
    ],
  },
];
export const serviceById = (id: string) => services.find((s) => s.id === id);
export const serviceAvailability = "Sob consulta"; // No partner is active merely because a profile was submitted.
export const partnerStatuses = {
  prospect: "Em prospecção",
  invited: "Convite preparado",
  pending: "Cadastro recebido",
  reviewing: "Em avaliação",
  qualified: "Pré-cadastro aprovado",
  declined: "Não aprovado",
  withdrawn: "Participação encerrada",
} as const;
export type PartnerStatus = keyof typeof partnerStatuses;
export const partnerTerms = {
  version: "cadastro-avaliacao-2026-09-27-v1",
  title: "Termos de cadastro para avaliação da rede",
  paragraphs: [
    "Este cadastro manifesta interesse em integrar a rede Descomplica Guarujá. Você declara ter pelo menos 18 anos, fornecer informações verdadeiras e ter autorização para representar o negócio informado.",
    "A equipe avaliará especialidades, área de atendimento e informações fornecidas. Enviar ou aprovar o pré-cadastro não ativa um perfil público, não garante pedidos ou renda e não autoriza iniciar serviços em nome do Descomplica.",
    "Não há cobrança por este cadastro de avaliação. Comissões, pagamentos, responsabilidades pela execução, cancelamento e demais condições de prestação serão apresentados e aceitos em instrumento específico antes de qualquer ativação comercial.",
    "Nome profissional, contato, serviços e informações enviadas serão utilizados para avaliar o cadastro e acompanhar a solicitação. Não envie documentos, dados bancários, dados de clientes ou informações sensíveis nesta etapa.",
    "A divulgação do perfil é uma autorização opcional e separada. Mesmo autorizada, só ocorrerá após aprovação e definição das condições comerciais. Materiais, fotos e referências só poderão ser utilizados com a autorização necessária.",
    "Receber oportunidades e atualizações pelo WhatsApp é opcional. A recusa não impede a avaliação do cadastro. Você pode retirar essa permissão ou encerrar sua participação pelo link privado recebido, ou pelo contato informado na política de privacidade.",
    "O sistema registra a versão destes termos, suas escolhas e o horário do envio. Este ambiente é de homologação: os aceites são testes e não ativam relações comerciais ou mensagens automáticas.",
  ],
} as const;
