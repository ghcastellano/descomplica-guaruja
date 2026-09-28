export const worlds = {
  resolver: {
    title: "Resolver",
    subtitle: "Menos imprevistos. Mais tempo para você.",
    description:
      "Conte o que precisa em casa. Nossa equipe avalia o pedido e combina os próximos passos com você.",
    categories: [
      "Limpeza",
      "Elétrica",
      "Hidráulica",
      "Ar-condicionado",
      "Pequenos reparos",
      "Outra necessidade",
    ],
  },
  casa: {
    title: "Cuidar da casa",
    subtitle: "Sua chegada começa antes de você.",
    description:
      "Da preparação para o fim de semana aos cuidados entre uma visita e outra. Um pedido, acompanhado do início ao fim.",
    categories: [
      "Preparar minha chegada",
      "Limpeza da casa",
      "Vistoria do imóvel",
      "Manutenção",
      "Outra necessidade",
    ],
  },
  experiencias: {
    title: "Viver uma experiência",
    subtitle: "O cenário é Guarujá. A história é sua.",
    description:
      "Experiências criadas e organizadas pela nossa equipe, com detalhes que fazem o momento ser de vocês.",
    categories: [
      "A Dois",
      "Celebrar",
      "Entre Amigas",
      "Pedido",
      "Quero ajuda para escolher",
    ],
  },
  parceiros: {
    title: "Ser parceiro",
    subtitle: "Quem conhece a cidade ajuda a fazê-la melhor.",
    description:
      "Estamos formando nossa rede local. Conte o que você faz. A equipe vai conhecer seu trabalho antes de qualquer oferta ao público.",
    categories: [
      "Limpeza",
      "Manutenção",
      "Serviços para imóveis",
      "Gastronomia",
      "Turismo e lazer",
      "Outro serviço",
    ],
  },
} as const;
export type Vertical = keyof typeof worlds;
export const statuses = {
  received: "Pedido recebido",
  reviewing: "Em avaliação",
  awaiting_client: "Aguardando você",
  completed: "Concluído",
  cancelled: "Encerrado",
} as const;
export type CityStatus = keyof typeof statuses;
export const transitions: Record<CityStatus, CityStatus[]> = {
  received: ["reviewing", "cancelled"],
  reviewing: ["awaiting_client", "completed", "cancelled"],
  awaiting_client: ["reviewing", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};
export function suggestVertical(text: string): Vertical {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/parcei|prestador|ofereco|trabalho com/.test(normalized))
    return "parceiros";
  if (
    /a dois|casal|anivers|celebr|amiga|namoro|casamento|experiencia/.test(
      normalized,
    )
  )
    return "experiencias";
  if (/chegada|veraneio|vistoria|segunda casa|fim de semana/.test(normalized))
    return "casa";
  return "resolver";
}
export function suggestCategory(text: string, vertical: Vertical): string {
  const q = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const rules: [RegExp, string][] =
    vertical === "experiencias"
      ? [
          [/a dois|casal/, "A Dois"],
          [/anivers|celebr/, "Celebrar"],
          [/amiga/, "Entre Amigas"],
          [/pedido|namoro|casamento/, "Pedido"],
        ]
      : vertical === "casa"
        ? [
            [/chegada|chegar|fim de semana/, "Preparar minha chegada"],
            [/limp/, "Limpeza da casa"],
            [/vistoria/, "Vistoria do imóvel"],
            [/manutencao/, "Manutenção"],
          ]
        : vertical === "resolver"
          ? [
              [/ar[ -]?condicionado/, "Ar-condicionado"],
              [/limp|faxin|estofad|sofa/, "Limpeza"],
              [/eletric|tomada|disjuntor/, "Elétrica"],
              [/torneira|vazamento|encanad|descarga|entupid/, "Hidráulica"],
              [/chuveiro|luminaria/, "Elétrica"],
              [/pintura|prateleira|moveis|fechadura/, "Pequenos reparos"],
            ]
          : [];
  return rules.find(([regex]) => regex.test(q))?.[1] || "";
}
export function isDiscoveryIntent(text: string) {
  return /o que (tem .*|posso )?fazer|conhecer (a cidade|guaruja)|quais praias|descobrir guaruja/i.test(
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
  );
}
