import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { hash, encrypt, decrypt } from "./crypto";
import { config } from "./config";
import catalog from "./catalog.json";
export const packages = catalog.packages;
export const briefingSchema = z
  .object({
    requestKey: z.uuid(),
    name: z.string().trim().min(2).max(100),
    contact: z.string().trim().min(3).max(150),
    packageId: z.enum(
      Object.keys(packages) as [
        keyof typeof packages,
        ...(keyof typeof packages)[],
      ],
    ),
    guests: z.number().int().min(2).max(8),
    location: z.enum(["praia", "casa", "ajuda"]),
    place: z.string().trim().max(150).default(""),
    period: z.enum(["manha", "tarde", "por-do-sol", "noite", "flexivel"]),
    budget: z.number().int().min(0).max(1000000),
    notes: z.string().trim().max(2000).default(""),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.packageId.startsWith("adois_") && v.guests !== 2)
      ctx.addIssue({
        code: "custom",
        path: ["guests"],
        message: "A Dois é exclusivo para 2 pessoas.",
      });
  });
export const revisionSchema = z
  .object({
    amountCents: z.number().int().min(100).max(100000000),
    items: z.array(z.string().trim().min(1).max(500)).min(1).max(30),
    clientNote: z.string().trim().max(2000),
    internalNote: z.string().trim().max(3000),
  })
  .strict();
export type Briefing = z.infer<typeof briefingSchema>;
export type Revision = z.infer<typeof revisionSchema>;
export class DomainError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const protocol = (n: string | number) =>
  `DG-${String(n).padStart(5, "0")}`;
export const money = (c: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    c / 100,
  );
export const locations = {
  praia: "Praia",
  casa: "Hospedagem ou casa",
  ajuda: "Ajuda para escolher",
};
export const periods = {
  manha: "Manhã",
  tarde: "Tarde",
  "por-do-sol": "Pôr do sol",
  noite: "Noite",
  flexivel: "Flexível",
};
const actor = "Sophia · sessão local de teste";
export async function createRequest(input: unknown) {
  const b = briefingSchema.parse(input),
    { requestKey, ...body } = b,
    fingerprint = hash(JSON.stringify(body));
  return db.begin(async (tx) => {
    const id = randomUUID();
    const rows =
      await tx`INSERT INTO requests(id,request_key,fingerprint,briefing) VALUES(${id},${requestKey},${fingerprint},${tx.json(body)}) ON CONFLICT(request_key) DO NOTHING RETURNING id,number`;
    if (!rows.length) {
      const [old] =
        await tx`SELECT id,number,fingerprint FROM requests WHERE request_key=${requestKey}`;
      if (old.fingerprint !== fingerprint)
        throw new DomainError(
          409,
          "Este envio já foi recebido com outros dados.",
        );
      return { id: old.id, protocol: protocol(old.number), duplicate: true };
    }
    const prices = (catalog.prices as Record<string, Record<string, number[]>>)[
      b.packageId
    ][String(b.guests)];
    const snapshot: Revision = {
      amountCents: Math.round((prices[0] + prices[1]) / 2) * 100,
      items: packages[b.packageId].inc,
      clientNote:
        "Experiência em planejamento. Local, data e condições ainda serão combinados.",
      internalNote: `Rascunho a partir da faixa estimada de ${money(prices[0] * 100)} a ${money(prices[1] * 100)}. Revisar custos, disponibilidade e itens antes de liberar.`,
    };
    await tx`INSERT INTO proposals(id) VALUES(${id})`;
    await tx`INSERT INTO proposal_revisions(proposal_id,version,snapshot) VALUES(${id},1,${tx.json(snapshot)})`;
    await tx`INSERT INTO audit_events(proposal_id,kind,actor,details) VALUES(${id},'created',${actor},${tx.json({ version: 1, source: "solicitação de teste" })})`;
    return { id, protocol: protocol(rows[0].number), duplicate: false };
  });
}
export async function listRequests() {
  return db`SELECT p.id,p.status,p.version,r.number,r.briefing,p.updated_at FROM proposals p JOIN requests r ON r.id=p.id ORDER BY p.updated_at DESC`;
}
export async function getProposal(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const [p] =
    await db`SELECT p.*,r.number,r.briefing,v.snapshot FROM proposals p JOIN requests r ON r.id=p.id JOIN proposal_revisions v ON v.proposal_id=p.id AND v.version=p.version WHERE p.id=${id}`;
  if (!p) return null;
  const events =
    await db`SELECT kind,actor,details,created_at FROM audit_events WHERE proposal_id=${id} ORDER BY id DESC`;
  const [out] =
    await db`SELECT payload_ciphertext,created_at FROM outbox WHERE proposal_id=${id} AND version=${p.version}`;
  const revisions =
    await db`SELECT version,snapshot,created_at FROM proposal_revisions WHERE proposal_id=${id} ORDER BY version DESC`;
  return {
    revisions: revisions.map((r) => ({
      version: Number(r.version),
      snapshot: r.snapshot as Revision,
      createdAt: r.created_at as Date,
    })),
    id: String(p.id),
    number: p.number as number,
    version: Number(p.version),
    status: String(p.status),
    briefing: p.briefing as Briefing,
    snapshot: p.snapshot as Revision,
    events,
    message:
      p.status === "released" && out
        ? JSON.parse(decrypt(out.payload_ciphertext))
        : null,
  };
}
export async function reviseProposal(
  id: string,
  version: number,
  input: unknown,
) {
  z.uuid().parse(id);
  z.number().int().positive().parse(version);
  const snapshot = revisionSchema.parse(input);
  return db.begin(async (tx) => {
    const [p] = await tx`SELECT * FROM proposals WHERE id=${id} FOR UPDATE`;
    if (!p) throw new DomainError(404, "Proposta não encontrada.");
    if (p.version !== version)
      throw new DomainError(
        409,
        "Esta proposta mudou. Atualize a página antes de revisar.",
      );
    const next = version + 1;
    await tx`INSERT INTO proposal_revisions(proposal_id,version,snapshot) VALUES(${id},${next},${tx.json(snapshot)})`;
    await tx`UPDATE proposals SET version=${next},status='draft',updated_at=now() WHERE id=${id}`;
    await tx`UPDATE proposal_links SET revoked_at=now() WHERE proposal_id=${id} AND revoked_at IS NULL`;
    await tx`INSERT INTO audit_events(proposal_id,kind,actor,details) VALUES(${id},'revised',${actor},${tx.json({ fromVersion: version, version: next, previousLinksRevoked: true })})`;
    return { version: next };
  });
}
export async function releaseProposal(id: string, version: number) {
  z.uuid().parse(id);
  z.number().int().positive().parse(version);
  return db.begin(async (tx) => {
    const [p] = await tx`SELECT * FROM proposals WHERE id=${id} FOR UPDATE`;
    if (!p) throw new DomainError(404, "Proposta não encontrada.");
    if (p.version !== version)
      throw new DomainError(
        409,
        "A revisão mudou. Releia a versão atual antes de liberar.",
      );
    if (p.status === "released") return { version, duplicate: true };
    const token = randomBytes(32).toString("base64url"),
      url = `${config().origin}/p/${token}`;
    const [r] = await tx`SELECT number FROM requests WHERE id=${id}`;
    const message = {
      url,
      text: `[SIMULAÇÃO — NÃO ENVIADO] Sua proposta ${protocol(r.number)} está pronta para conhecer: ${url}\nEste link é um teste local; não confirma reserva nem pagamento.`,
    };
    await tx`INSERT INTO proposal_links(token_hash,proposal_id,version,expires_at) VALUES(${hash(token)},${id},${version},now()+interval '7 days')`;
    await tx`INSERT INTO outbox(id,proposal_id,version,payload_ciphertext) VALUES(${randomUUID()},${id},${version},${encrypt(JSON.stringify(message))})`;
    await tx`UPDATE proposals SET status='released',updated_at=now() WHERE id=${id}`;
    await tx`INSERT INTO audit_events(proposal_id,kind,actor,details) VALUES(${id},'released',${actor},${tx.json({ version, delivery: "simulated", expiresInDays: 7 })})`;
    return { version, duplicate: false };
  });
}
export async function clientProposal(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [p] =
    await db`SELECT r.number,r.briefing,v.snapshot,l.version,l.expires_at FROM proposal_links l JOIN proposals p ON p.id=l.proposal_id AND p.version=l.version JOIN requests r ON r.id=p.id JOIN proposal_revisions v ON v.proposal_id=p.id AND v.version=l.version WHERE l.token_hash=${hash(token)} AND l.revoked_at IS NULL AND l.expires_at>now() AND p.status='released'`;
  if (!p) return null;
  const b = p.briefing as Briefing,
    s = p.snapshot as Revision;
  return {
    protocol: protocol(p.number),
    version: p.version,
    collection: packages[b.packageId].col,
    tier: packages[b.packageId].tier,
    guests: b.guests,
    location: locations[b.location],
    place: b.place,
    period: periods[b.period],
    amountCents: s.amountCents,
    items: s.items,
    clientNote: s.clientNote,
    expiresAt: p.expires_at,
  };
}
