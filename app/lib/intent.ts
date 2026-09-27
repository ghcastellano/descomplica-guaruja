import { z } from "zod";
import { serviceById } from "./service-catalog";
import {
  worlds,
  suggestVertical,
  suggestCategory,
  isDiscoveryIntent,
} from "./city-catalog";

export const interpretationSchema = z
  .object({
    discovery: z.boolean(),
    vertical: z.enum(["resolver", "casa", "experiencias", "parceiros"]),
    category: z.string().max(60),
    serviceId: z.string().max(60).default(""),
    guests: z.number().int().min(1).max(1000).nullable(),
    neighborhood: z.enum([
      "",
      "Astúrias",
      "Tombo",
      "Pitangueiras",
      "Enseada",
      "Pernambuco",
      "Guaiúba",
      "Perequê",
      "Centro",
    ]),
    date: z.string().max(10),
    period: z.enum(["flexivel", "manha", "tarde", "por-do-sol", "noite"]),
  })
  .strict()
  .refine(
    (x) =>
      !x.category ||
      (worlds[x.vertical].categories as readonly string[]).includes(x.category),
    "Categoria incompatível",
  );
export type Interpretation = z.infer<typeof interpretationSchema>;
export type IntentResponse = {
  interpretation: Interpretation;
  source: "ai" | "rules";
};

export function fallbackIntent(text: string): Interpretation {
  const vertical = suggestVertical(text);
  const count = text.match(
    /\b(\d{1,4})\s*(?:pessoas|amigas|amigos|convidad)/i,
  )?.[1];
  return {
    discovery: isDiscoveryIntent(text),
    vertical,
    category:
      suggestCategory(text, vertical) === "A Dois" && count && Number(count) > 2
        ? ""
        : suggestCategory(text, vertical),
    serviceId: "",
    guests: count ? Math.min(1000, Number(count)) || null : null,
    neighborhood: "",
    date: "",
    period: "flexivel",
  };
}

export function normalizeInterpretation(
  value: unknown,
  today: string,
): Interpretation {
  const parsed = interpretationSchema.parse(value);
  // A model can extract preferences, never expand the catalogue's capacity.
  if (parsed.category === "A Dois" && parsed.guests && parsed.guests > 2)
    parsed.category = "";
  if (parsed.vertical !== "experiencias") parsed.guests = null;
  const service = serviceById(parsed.serviceId);
  if (service && service.vertical === parsed.vertical)
    parsed.category = service.category;
  else parsed.serviceId = "";
  const date = parsed.date;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date ||
    date < today
  )
    parsed.date = "";
  return parsed;
}

export function redactContact(text: string) {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[contato removido]")
    .replace(
      /(?:\+?55[\s.-]*)?\(?\d{2}\)?[\s.-]*\d{4,5}[\s.-]*\d{4}\b/g,
      "[contato removido]",
    );
}
