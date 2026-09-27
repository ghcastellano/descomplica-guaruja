import { createHmac, randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { config } from "./config";
import { hash, decrypt } from "./crypto";
import { DomainError, clientProposal } from "./domain";
import { bookingContext, type PublicBooking } from "./booking";
import { worlds, transitions, type CityStatus } from "./city-catalog";

export const citySchema = z
  .object({
    requestKey: z.uuid(),
    vertical: z.enum(["resolver", "casa", "experiencias", "parceiros"]),
    category: z.string().min(2).max(80),
    description: z
      .string()
      .trim()
      .min(10, "Conte um pouco mais sobre o pedido.")
      .max(2000),
    neighborhood: z.string().trim().min(2).max(100),
    period: z.enum(["manha", "tarde", "por-do-sol", "noite", "flexivel"]),
    preferredDate: z.union([z.literal(""), z.iso.date()]),
    name: z.string().trim().min(2).max(100),
    contact: z
      .string()
      .trim()
      .max(150)
      .refine(
        (v) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
          /^\+?[\d ()-]{10,20}$/.test(v),
        "Informe um e-mail ou telefone válido.",
      ),
    guests: z.number().int().min(2).max(8).optional(),
    consent: z.literal(true),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      !(worlds[v.vertical].categories as readonly string[]).includes(v.category)
    )
      ctx.addIssue({ code: "custom", message: "Categoria inválida." });
    if (
      v.vertical === "experiencias" &&
      (!v.guests || (v.category === "A Dois" && v.guests !== 2))
    )
      ctx.addIssue({
        code: "custom",
        message:
          "A Dois é para 2 pessoas. As demais experiências recebem de 2 a 8.",
      });
  });
export const cityProtocol = (n: string | number) =>
  `GU-${String(n).padStart(5, "0")}`;
const tokenFor = (key: string) =>
  createHmac("sha256", config().secret)
    .update("city-tracking:" + key)
    .digest("base64url");
export async function createCityRequest(input: unknown) {
  const { requestKey, ...briefing } = citySchema.parse(input);
  const fingerprint = hash(JSON.stringify(briefing)),
    token = tokenFor(requestKey);
  return db.begin(async (tx) => {
    const rows =
      await tx`INSERT INTO city_requests(id,request_key,fingerprint,token_hash,vertical,category,briefing)
      VALUES(${randomUUID()},${requestKey},${fingerprint},${hash(token)},${briefing.vertical},${briefing.category},${tx.json(briefing)})
      ON CONFLICT(request_key) DO NOTHING RETURNING id,number`;
    if (!rows.length) {
      const [old] =
        await tx`SELECT id,number,fingerprint FROM city_requests WHERE request_key=${requestKey}`;
      if (old.fingerprint !== fingerprint)
        throw new DomainError(
          409,
          "Este envio já foi recebido com outros dados. Atualize a página para um novo pedido.",
        );
      return {
        protocol: cityProtocol(old.number),
        url: `/pedidos/${token}`,
        duplicate: true,
      };
    }
    await tx`INSERT INTO city_request_events(request_id,actor,kind,public_note) VALUES(${rows[0].id},'cliente','received','Recebemos seu pedido. Nossa equipe vai avaliar os detalhes antes de confirmar atendimento, preço ou disponibilidade.')`;
    return {
      protocol: cityProtocol(rows[0].number),
      url: `/pedidos/${token}`,
      duplicate: false,
    };
  });
}
export async function getPublicCityRequest(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [r] =
    await db`SELECT id,number,category,status,created_at,experience_request_id FROM city_requests WHERE token_hash=${hash(token)} AND created_at>now()-interval '90 days'`;
  if (!r) return null;
  const events =
    await db`SELECT kind,public_note,created_at FROM city_request_events WHERE request_id=${r.id} ORDER BY id`;
  let proposalPath: string | null = null;
  let booking: Pick<PublicBooking, "status" | "paymentReview"> | null = null;
  if (r.experience_request_id) {
    const [delivery] =
      await db`SELECT o.payload_ciphertext FROM outbox o JOIN proposals p ON p.id=o.proposal_id AND p.version=o.version WHERE p.id=${r.experience_request_id} AND p.status='released'`;
    if (delivery) {
      const url = new URL(JSON.parse(decrypt(delivery.payload_ciphertext)).url);
      const proposalToken = url.pathname.match(
        /^\/p\/([A-Za-z0-9_-]{43})$/,
      )?.[1];
      if (
        proposalToken &&
        (await clientProposal(proposalToken))
      ) {
        // Only return a verified relative path. Local and hosted previews share this database.
        proposalPath = url.pathname;
        const current = (await bookingContext(proposalToken)).booking;
        if (current) booking = { status: current.status, paymentReview: current.paymentReview };
      }
    }
  }
  return {
    protocol: cityProtocol(r.number),
    category: r.category as string,
    status: r.status as CityStatus,
    events,
    proposalPath,
    booking,
  };
}
export async function listCityRequests(query = "", status = "") {
  const search = "%" + query.trim().slice(0, 150).replace(/[\\%_]/g, "\\$&") + "%";
  return db`SELECT id,number,vertical,category,briefing,status,version,updated_at,experience_request_id
    FROM city_requests WHERE (${status}='' OR status=${status}) AND
    (briefing->>'name' ILIKE ${search} OR briefing->>'contact' ILIKE ${search} OR category ILIKE ${search}
    OR ('GU-' || lpad(number::text,5,'0')) ILIKE ${search}) ORDER BY updated_at DESC LIMIT 200`;
}
export async function experiencePreferences(requestId: string) {
  const [r] = await db`SELECT briefing FROM city_requests WHERE experience_request_id=${requestId}`;
  if (!r) return undefined;
  const b = r.briefing as z.infer<typeof citySchema>;
  return { guests: b.guests, place: b.neighborhood, period: b.period, collection: b.category, preferredDate: b.preferredDate };
}
type CityRow = {
  id: string;
  number: string;
  vertical: keyof typeof worlds;
  category: string;
  briefing: z.infer<typeof citySchema>;
  status: CityStatus;
  version: number;
  experience_request_id: string | null;
};
export async function getCityRequest(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const [r] = await db<CityRow[]>`SELECT * FROM city_requests WHERE id=${id}`;
  if (!r) return null;
  const events =
    await db`SELECT * FROM city_request_events WHERE request_id=${id} ORDER BY id`;
  return { ...r, events };
}
const updateSchema = z
  .object({
    version: z.number().int().positive(),
    status: z.enum([
      "received",
      "reviewing",
      "awaiting_client",
      "completed",
      "cancelled",
    ]),
    publicNote: z.string().trim().min(5).max(1000),
    internalNote: z.string().trim().max(2000),
  })
  .strict();
export async function updateCityRequest(id: string, input: unknown) {
  z.uuid().parse(id);
  const update = updateSchema.parse(input);
  return db.begin(async (tx) => {
    const [r] =
      await tx`SELECT status,version FROM city_requests WHERE id=${id} FOR UPDATE`;
    if (!r) throw new DomainError(404, "Pedido não encontrado.");
    if (r.version !== update.version)
      throw new DomainError(
        409,
        "Outra atualização foi salva. Recarregue antes de continuar.",
      );
    if (!transitions[r.status as CityStatus].includes(update.status))
      throw new DomainError(422, "Essa mudança de etapa não está disponível.");
    await tx`UPDATE city_requests SET status=${update.status},version=version+1,updated_at=now() WHERE id=${id}`;
    await tx`INSERT INTO city_request_events(request_id,actor,kind,public_note,internal_note) VALUES(${id},'Equipe · acesso de teste',${update.status},${update.publicNote},${update.internalNote})`;
    return { ok: true };
  });
}
// Atomic bridge into the existing experience engine; retrying never duplicates a lead.
export async function prepareExperience(id: string) {
  z.uuid().parse(id);
  return db.begin(async (tx) => {
    const [r] = await tx`SELECT * FROM city_requests WHERE id=${id} FOR UPDATE`;
    if (!r || r.vertical !== "experiencias")
      throw new DomainError(422, "Selecione um pedido de experiência.");
    if (r.experience_request_id) return { id: r.experience_request_id };
    if (["completed", "cancelled"].includes(r.status))
      throw new DomainError(422, "Este atendimento está encerrado.");
    const requestId = randomUUID(),
      b = r.briefing;
    const briefing = {
      name: b.name,
      contact: b.contact,
      source: "questionario",
      notes: `${cityProtocol(r.number)} · ${b.category} · ${b.guests} pessoas · ${b.neighborhood} · ${b.preferredDate || "Data flexível"} · ${b.period}\n${b.description}`,
    };
    await tx`INSERT INTO requests(id,request_key,fingerprint,briefing) VALUES(${requestId},${randomUUID()},${hash(JSON.stringify(briefing))},${tx.json(briefing)})`;
    await tx`INSERT INTO audit_events(proposal_id,kind,actor,details) VALUES(${requestId},'inquiry_created','Equipe · acesso de teste',${tx.json({ cityRequestId: id })})`;
    await tx`UPDATE city_requests SET experience_request_id=${requestId},status='reviewing',version=version+1,updated_at=now() WHERE id=${id}`;
    await tx`INSERT INTO city_request_events(request_id,actor,kind,public_note) VALUES(${id},'Equipe · acesso de teste','experience_planning','Sua experiência entrou em planejamento. A proposta será revisada pela equipe antes de ser enviada.')`;
    return { id: requestId };
  });
}
