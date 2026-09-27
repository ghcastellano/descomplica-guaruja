import { randomBytes, randomUUID, createHmac } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { hash, encrypt, decrypt } from "./crypto";
import { config } from "./config";
import { DomainError } from "./domain";
import { services, partnerTerms, type PartnerStatus } from "./service-catalog";
export const partnerProtocol = (n: number | string) =>
  `REDE-${String(n).padStart(5, "0")}`;
const contact = z
  .string()
  .trim()
  .max(150)
  .refine(
    (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^\+?[\d ()-]{10,20}$/.test(v),
    "Informe um telefone ou e-mail válido.",
  );
const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    contact,
    serviceIds: z
      .array(
        z
          .string()
          .refine(
            (v) => v === "outro" || services.some((s) => s.id === v),
            "Serviço inválido.",
          ),
      )
      .min(1)
      .max(12)
      .transform((v) => [...new Set(v)].sort()),
    areas: z.string().trim().min(3).max(300),
    availability: z.string().trim().min(3).max(300),
    description: z.string().trim().min(10).max(1500),
    termsVersion: z.literal(partnerTerms.version),
    accepted: z.literal(true),
    adult: z.literal(true),
    publishPermission: z.boolean(),
    whatsappPermission: z.boolean(),
  })
  .strict();
export const partnerApplicationSchema = profileSchema
  .extend({
    requestKey: z.uuid(),
    token: z
      .string()
      .regex(/^[A-Za-z0-9_-]{43}$/)
      .optional(),
  })
  .refine(
    (v) => !v.whatsappPermission || /^\+?[\d ()-]{10,20}$/.test(v.contact),
    "Para autorizar WhatsApp, informe um telefone no campo de contato.",
  );
const tokenFor = (key: string) =>
  createHmac("sha256", config().secret)
    .update("network:" + key)
    .digest("base64url");
const receipt = (number: string, token: string) => ({
  protocol: partnerProtocol(number),
  url: `/rede/${token}`,
});
export function networkActor(request: Request) {
  const ip =
    process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
      : "local";
  return createHmac("sha256", config().secret)
    .update("network-rate:" + ip)
    .digest("hex");
}
export async function applyPartner(input: unknown, actor = "local") {
  const {
    requestKey,
    token: invite,
    ...profile
  } = partnerApplicationSchema.parse(input);
  const fingerprint = hash(JSON.stringify(profile)),
    token = invite || tokenFor(requestKey);
  return db.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(846523)`;
    const [old] =
      await tx`SELECT * FROM network_partners WHERE request_key=${requestKey}`;
    if (old) {
      if (old.fingerprint !== fingerprint || old.token_hash !== hash(token))
        throw new DomainError(
          409,
          "Este envio já foi recebido. Use o link de acompanhamento.",
        );
      return receipt(String(old.number), token);
    }
    const [limit] =
      await tx`SELECT count(*)::int AS total,count(*) FILTER(WHERE details->>'actorHash'=${actor})::int AS client FROM network_partner_events WHERE kind='application' AND created_at>now()-interval '1 hour'`;
    if (limit.total >= 60 || limit.client >= 5)
      throw new DomainError(429, "Aguarde antes de enviar outro cadastro.");
    let row;
    if (invite) {
      const [found] =
        await tx`SELECT * FROM network_partners WHERE token_hash=${hash(invite)} AND expires_at>now() FOR UPDATE`;
      if (!found || found.status !== "invited")
        throw new DomainError(
          409,
          "Este convite não está disponível para um novo cadastro.",
        );
      [row] =
        await tx`UPDATE network_partners SET request_key=${requestKey},fingerprint=${fingerprint},status='pending',name=${profile.name},contact=${profile.contact},profile=${tx.json(profile)},version=version+1,updated_at=now() WHERE id=${found.id} RETURNING id,number`;
    } else {
      [row] =
        await tx`INSERT INTO network_partners(id,request_key,fingerprint,token_hash,token_ciphertext,status,name,contact,source,profile) VALUES(${randomUUID()},${requestKey},${fingerprint},${hash(token)},${encrypt(token)},'pending',${profile.name},${profile.contact},'Inscrição voluntária',${tx.json(profile)}) RETURNING id,number`;
    }
    const termsText = partnerTerms.paragraphs.join("\n\n");
    await tx`INSERT INTO network_partner_events(partner_id,actor,kind,details) VALUES(${row.id},'profissional','application',${tx.json({ termsVersion: partnerTerms.version, termsText, termsHash: hash(termsText), accepted: true, adult: true, name: profile.name, contact: profile.contact, publishPermission: profile.publishPermission, whatsappPermission: profile.whatsappPermission, actorHash: actor, identityVerified: false })})`;
    return receipt(String(row.number), token);
  });
}
export async function createProspect(input: unknown) {
  const v = z
    .object({
      requestKey: z.uuid(),
      name: z.string().trim().min(2).max(100),
      contact,
      source: z.string().trim().min(5).max(500),
    })
    .strict()
    .parse(input);
  const token = tokenFor(v.requestKey),
    fingerprint = hash(JSON.stringify(v));
  return db.begin(async (tx) => {
    const [row] =
      await tx`INSERT INTO network_partners(id,prospect_key,prospect_fingerprint,token_hash,token_ciphertext,status,name,contact,source) VALUES(${randomUUID()},${v.requestKey},${fingerprint},${hash(token)},${encrypt(token)},'prospect',${v.name},${v.contact},${v.source}) ON CONFLICT(prospect_key) DO NOTHING RETURNING *`;
    if (!row) {
      const [old] =
        await tx`SELECT * FROM network_partners WHERE prospect_key=${v.requestKey}`;
      if (old.prospect_fingerprint !== fingerprint)
        throw new DomainError(409, "Este registro já existe com outros dados.");
      return { id: old.id, ...receipt(String(old.number), token) };
    }
    await tx`INSERT INTO network_partner_events(partner_id,actor,kind,details) VALUES(${row.id},'Equipe · acesso de teste','prospect',${tx.json({ source: v.source })})`;
    return { id: row.id, ...receipt(String(row.number), token) };
  });
}
export async function publicPartner(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [r] =
    await db`SELECT id,number,status,version,profile FROM network_partners WHERE token_hash=${hash(token)} AND expires_at>now()`;
  if (!r || r.status === "prospect") return null;
  const events =
    await db`SELECT kind,created_at,details->>'termsVersion' AS terms_version,details->>'termsHash' AS terms_hash,details->>'termsText' AS terms_text FROM network_partner_events WHERE partner_id=${r.id} ORDER BY id`;
  return {
    protocol: partnerProtocol(r.number),
    status: r.status as PartnerStatus,
    version: r.version as number,
    publishPermission: r.profile.publishPermission === true,
    whatsappPermission: r.profile.whatsappPermission === true,
    events,
  };
}
export async function updatePartnerPermission(token: string, input: unknown) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new DomainError(404, "Link não encontrado.");
  const v = z
    .object({
      version: z.number().int().positive(),
      withdraw: z.boolean(),
      publishPermission: z.boolean(),
      whatsappPermission: z.boolean(),
    })
    .strict()
    .parse(input);
  return db.begin(async (tx) => {
    const [r] =
      await tx`SELECT * FROM network_partners WHERE token_hash=${hash(token)} AND expires_at>now() FOR UPDATE`;
    if (!r) throw new DomainError(404, "Link indisponível.");
    if (r.version !== v.version)
      throw new DomainError(409, "O cadastro mudou. Atualize a página.");
    if (["declined", "withdrawn"].includes(r.status))
      throw new DomainError(409, "Esta participação já foi encerrada.");
    if (["prospect", "invited"].includes(r.status) && !v.withdraw)
      throw new DomainError(
        422,
        "Complete o cadastro para registrar suas escolhas.",
      );
    if (
      !v.withdraw &&
      v.whatsappPermission &&
      !/^\+?[\d ()-]{10,20}$/.test(r.contact)
    )
      throw new DomainError(
        422,
        "O cadastro usa e-mail. Fale com a equipe para confirmar um número de WhatsApp antes de autorizar.",
      );
    const publishPermission = !v.withdraw && v.publishPermission,
      whatsappPermission = !v.withdraw && v.whatsappPermission;
    await tx`UPDATE network_partners SET status=${v.withdraw ? "withdrawn" : r.status},profile=profile||${tx.json({ publishPermission, whatsappPermission })},version=version+1,updated_at=now() WHERE id=${r.id}`;
    await tx`INSERT INTO network_partner_events(partner_id,actor,kind,details) VALUES(${r.id},'profissional',${v.withdraw ? "withdrawn" : "permissions"},${tx.json({ publishPermission, whatsappPermission })})`;
    return { ok: true };
  });
}
export async function listPartners() {
  return db`SELECT id,number,name,status,updated_at FROM network_partners ORDER BY updated_at DESC LIMIT 200`;
}
type PartnerRow = {
  id: string;
  number: string;
  status: PartnerStatus;
  version: number;
  name: string;
  contact: string;
  source: string;
  token_ciphertext: string;
  profile: Partial<z.infer<typeof profileSchema>>;
};
export async function getPartner(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const [r] = await db<
    PartnerRow[]
  >`SELECT * FROM network_partners WHERE id=${id}`;
  if (!r) return null;
  const events =
    await db`SELECT * FROM network_partner_events WHERE partner_id=${id} ORDER BY id`;
  return { ...r, url: `/rede/${decrypt(r.token_ciphertext)}`, events };
}
export async function reviewPartner(id: string, input: unknown) {
  z.uuid().parse(id);
  const v = z
    .object({
      version: z.number().int().positive(),
      status: z.enum(["invited", "reviewing", "qualified", "declined"]),
      note: z.string().trim().min(10).max(1500),
      verified: z.boolean(),
    })
    .strict()
    .parse(input);
  const transitions: Record<string, string[]> = {
    prospect: ["invited", "declined"],
    invited: ["declined"],
    pending: ["reviewing", "declined"],
    reviewing: ["qualified", "declined"],
  };
  return db.begin(async (tx) => {
    const [r] =
      await tx`SELECT * FROM network_partners WHERE id=${id} FOR UPDATE`;
    if (!r) throw new DomainError(404, "Cadastro não encontrado.");
    if (r.version !== v.version)
      throw new DomainError(
        409,
        "Outra atualização foi salva. Recarregue a página.",
      );
    if (!transitions[r.status]?.includes(v.status))
      throw new DomainError(422, "Mudança de etapa indisponível.");
    if (v.status === "qualified" && !v.verified)
      throw new DomainError(
        422,
        "Confirme a verificação de contato e especialidades antes de aprovar.",
      );
    await tx`UPDATE network_partners SET status=${v.status},profile=CASE WHEN ${v.status}='declined' THEN profile||'{"publishPermission":false,"whatsappPermission":false}'::jsonb ELSE profile END,version=version+1,updated_at=now() WHERE id=${id}`;
    await tx`INSERT INTO network_partner_events(partner_id,actor,kind,details) VALUES(${id},'Equipe · acesso de teste',${v.status},${tx.json({ note: v.note, verified: v.verified })})`;
    return { ok: true };
  });
}
