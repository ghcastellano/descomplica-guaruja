import { services } from "./service-catalog";
import type { Interpretation } from "./intent";

const normalized = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const clues: Record<string, RegExp> = {
  "limpeza-pos-obra": /pos.?obra|apos.*obra|reforma/,
  "higienizacao-estofados": /sofa|estofad|colchao/,
  "limpeza-vidros": /vidro|janela/,
  "limpeza-residencial": /faxina|limpeza/,
  "tomadas-interruptores": /tomada|interruptor/,
  "eletrica-diagnostico": /disjuntor|eletric|curto/,
  luminarias: /luminaria|lustre/,
  chuveiro: /chuveiro/,
  torneira: /torneira/,
  vazamento: /vazamento|vazando/,
  descarga: /descarga/,
  desentupimento: /entupid|desentup/,
  "ar-limpeza": /limp|higieniz/,
  "ar-instalacao": /instal/,
  "ar-diagnostico": /nao gela|parou|barulho|problema/,
  "montagem-moveis": /moveis|montagem|armario/,
  fixacoes: /prateleira|suporte/,
  pintura: /pintura|pintar/,
  "portas-fechaduras": /porta|fechadura/,
};
export function matchingServices(text: string, result: Interpretation) {
  const q = normalized(text);
  return services
    .filter(
      (s) => s.vertical === result.vertical && s.category === result.category,
    )
    .map((s) => ({
      service: s,
      score: s.id === result.serviceId ? 100 : clues[s.id]?.test(q) ? 10 : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ service }) => service);
}

export function inferredService(
  text: string,
  vertical: string,
  category: string,
) {
  const q = normalized(text);
  const candidates = services.filter(
    (s) => s.vertical === vertical && s.category === category,
  );
  if (candidates.length === 1) return candidates[0].id;
  return (
    Object.entries(clues).find(
      ([id, clue]) => candidates.some((s) => s.id === id) && clue.test(q),
    )?.[0] || ""
  );
}
