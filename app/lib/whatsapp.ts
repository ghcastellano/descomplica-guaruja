import { createHmac } from "node:crypto";
import { z } from "zod";
import { config } from "./config";
import { db } from "./db";
import { encrypt, decrypt, equal, hash } from "./crypto";
import { DomainError } from "./domain";

const phone = z.string().regex(/^[1-9]\d{7,14}$/);
const identifier = z.string().regex(/^\d{5,30}$/);
const timestamp = z.string().regex(/^\d{1,11}$/).refine(v => Number(v) > 0 && Number(v) < 4102444800);
export const whatsappKeys = ["WHATSAPP_APP_SECRET", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_WABA_ID", "WHATSAPP_TEST_RECIPIENTS"] as const;
export function whatsappStatus() {
  return {
    enabled: process.env.WHATSAPP_MODE === "test",
    missing: [...whatsappKeys, "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_GRAPH_VERSION"].filter(k => !process.env[k]?.trim()),
  };
}
function settings() {
  config(); // Retain the application's staging/local environment restrictions.
  if (process.env.WHATSAPP_MODE !== "test") throw new DomainError(503, "WhatsApp de teste ainda não ativado.");
  const secret = process.env.WHATSAPP_APP_SECRET || "";
  const recipients = (process.env.WHATSAPP_TEST_RECIPIENTS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (secret.length < 16 || recipients.length === 0 || recipients.length > 5 || recipients.some(p => !phone.safeParse(p).success))
    throw new DomainError(503, "Configuração do WhatsApp de teste incompleta.");
  return { secret, recipients, phoneId: identifier.parse(process.env.WHATSAPP_PHONE_NUMBER_ID), wabaId: identifier.parse(process.env.WHATSAPP_WABA_ID) };
}
export function verifyChallenge(url: string) {
  const p = new URL(url).searchParams;
  const expected = process.env.WHATSAPP_VERIFY_TOKEN || "";
  if (expected.length < 32) throw new DomainError(503, "Verificação ainda não configurada.");
  if (p.get("hub.mode") !== "subscribe" || !equal(p.get("hub.verify_token") || "", expected))
    throw new DomainError(403, "Verificação inválida.");
  const challenge = p.get("hub.challenge") || "";
  if (!/^\d{1,100}$/.test(challenge)) throw new DomainError(400, "Desafio inválido.");
  return challenge;
}
export function verifySignature(raw: string, signature: string | null, secret: string) {
  if (!/^sha256=[a-f0-9]{64}$/.test(signature || "")) return false;
  return equal(signature!, "sha256=" + createHmac("sha256", secret).update(raw).digest("hex"));
}
const messageSchema = z.object({
  from: phone, id: z.string().min(1).max(300), timestamp,
  type: z.string().min(1).max(50), text: z.object({ body: z.string().max(6000) }).optional(),
});
const statusSchema = z.object({
  id: z.string().min(1).max(300), recipient_id: phone, timestamp,
  status: z.enum(["sent", "delivered", "read", "failed", "deleted"]),
  errors: z.array(z.object({ code: z.number().int() })).max(10).optional(),
});
const envelope = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(z.object({ id: z.string(), changes: z.array(z.object({
    field: z.string(), value: z.object({
      messaging_product: z.literal("whatsapp"),
      metadata: z.object({ phone_number_id: z.string() }),
      messages: z.array(messageSchema).max(100).optional(),
      statuses: z.array(statusSchema).max(100).optional(),
    }),
  })).max(100) })).max(100),
});
type EventPayload = { contact: string; type?: string; text?: string; status?: string; errorCodes?: number[] };
const contactHash = (value: string) => createHmac("sha256", config().secret).update("whatsapp:" + process.env.WHATSAPP_PHONE_NUMBER_ID + ":" + value).digest("hex");
export async function receiveWhatsApp(raw: string, signature: string | null) {
  const cfg = settings();
  if (Buffer.byteLength(raw) > 256_000) throw new DomainError(413, "Evento muito grande.");
  if (!verifySignature(raw, signature, cfg.secret)) throw new DomainError(401, "Assinatura inválida.");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new DomainError(400, "Evento inválido."); }
  const data = envelope.parse(parsed);
  const events: { key: string; kind: string; id: string; at: Date; payload: EventPayload }[] = [];
  for (const entry of data.entry) for (const change of entry.changes) {
    if (entry.id !== cfg.wabaId || change.field !== "messages" || change.value.metadata.phone_number_id !== cfg.phoneId) continue;
    for (const m of change.value.messages || []) {
      if (!cfg.recipients.includes(m.from)) continue;
      events.push({ key: hash(`${cfg.phoneId}:message:${m.id}`), kind: "message", id: m.id, at: new Date(Number(m.timestamp) * 1000),
        payload: { contact: m.from, type: m.type, text: m.type === "text" ? m.text?.body : undefined } });
    }
    for (const s of change.value.statuses || []) {
      if (!cfg.recipients.includes(s.recipient_id)) continue;
      events.push({ key: hash(`${cfg.phoneId}:status:${s.id}:${s.status}:${s.timestamp}`), kind: "status", id: s.id, at: new Date(Number(s.timestamp) * 1000),
        payload: { contact: s.recipient_id, status: s.status, errorCodes: s.errors?.map(e => e.code) } });
    }
  }
  // Acknowledge only after the whole batch is durable; retries insert only new events.
  return db.begin(async tx => {
    let inserted = 0;
    for (const e of events) {
      const rows = await tx`INSERT INTO whatsapp_test_events(event_key,kind,message_id,contact_hash,event_at,payload_ciphertext)
        VALUES(${e.key},${e.kind},${e.id},${contactHash(e.payload.contact)},${e.at},${encrypt(JSON.stringify(e.payload))})
        ON CONFLICT(event_key) DO NOTHING RETURNING id`;
      inserted += rows.length;
    }
    return inserted;
  });
}
export async function recentWhatsAppEvents() {
  const rows = await db`SELECT id,kind,event_at,payload_ciphertext FROM whatsapp_test_events ORDER BY received_at DESC,id DESC LIMIT 50`;
  return rows.map(r => ({ id: String(r.id), kind: r.kind as string, at: r.event_at as Date, payload: JSON.parse(decrypt(r.payload_ciphertext)) as EventPayload }));
}

export const testSendSchema = z.object({
  requestKey: z.uuid(), to: phone,
  kind: z.enum(["hello_world", "text"]), text: z.string().trim().min(1).max(1000).optional(),
}).refine(v => v.kind !== "text" || !!v.text, "Informe o texto da resposta.");
export async function sendWhatsAppTest(input: unknown, transport: typeof fetch = fetch) {
  const v = testSendSchema.parse(input), cfg = settings();
  if (!cfg.recipients.includes(v.to)) throw new DomainError(403, "Destinatário fora da lista de testes.");
  const token = process.env.WHATSAPP_ACCESS_TOKEN || "", version = process.env.WHATSAPP_GRAPH_VERSION || "";
  if (token.length < 20 || !/^v\d{2}\.0$/.test(version)) throw new DomainError(503, "Credencial de envio não configurada.");
  const fingerprint = hash(JSON.stringify([cfg.phoneId,v.to,v.kind,v.text || ""]));
  const result = await db.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(846529)`;
    const [previous] = await tx`SELECT fingerprint,state,message_id FROM whatsapp_test_sends WHERE request_key=${v.requestKey}`;
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new DomainError(409, "Chave de teste já usada com outro conteúdo.");
      return { send: false, state: previous.state as string, messageId: previous.message_id as string | null };
    }
    const [count] = await tx`SELECT count(*)::int AS n FROM whatsapp_test_sends WHERE created_at >= now()-interval '24 hours'`;
    if (count.n >= 10) throw new DomainError(429, "Limite de 10 tentativas de teste em 24 horas.");
    if (v.kind === "text") {
      const [incoming] = await tx`SELECT id FROM whatsapp_test_events WHERE contact_hash=${contactHash(v.to)} AND kind='message'
        AND event_at > now()-interval '24 hours' AND event_at <= now() ORDER BY event_at DESC LIMIT 1`;
      if (!incoming) throw new DomainError(409, "Peça ao destinatário que envie uma mensagem antes de responder por texto.");
    }
    await tx`INSERT INTO whatsapp_test_sends(request_key,fingerprint,state) VALUES(${v.requestKey},${fingerprint},'sending')`;
    return { send: true, state: "sending", messageId: null as string | null };
  });
  if (!result.send) return { state: result.state, messageId: result.messageId, repeated: true };
  let state = "unknown", messageId: string | null = null, errorCode: string | null = null;
  try {
    const res = await transport(`https://graph.facebook.com/${version}/${cfg.phoneId}/messages`, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: v.to,
        ...(v.kind === "hello_world" ? { type: "template", template: { name: "hello_world", language: { code: "en_US" } } } : { type: "text", text: { body: v.text } }) }),
    });
    const body = await res.json();
    if (res.ok && typeof body.messages?.[0]?.id === "string") { state = "accepted"; messageId = body.messages[0].id; }
    else if (res.status >= 400 && res.status < 500) { state = "rejected"; errorCode = String(Number.isInteger(body.error?.code) ? body.error.code : res.status); }
  } catch { /* Ambiguous results remain unknown; never automatically resend. */ }
  await db`UPDATE whatsapp_test_sends SET state=${state},message_id=${messageId},error_code=${errorCode},updated_at=now() WHERE request_key=${v.requestKey}`;
  return { state, messageId, repeated: false };
}
