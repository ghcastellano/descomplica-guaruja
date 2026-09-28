import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID, randomInt } from "node:crypto";
const url = new URL(process.env.DATABASE_URL!);
if (url.hostname !== "127.0.0.1" || url.pathname !== "/descomplica_test") throw Error("Only isolated local tests");
const { db } = await import("../lib/db");
const { migrate } = await import("../scripts/migrate");
const { receiveWhatsApp, sendWhatsAppTest, verifyChallenge, recentWhatsAppEvents } = await import("../lib/whatsapp");
const { GET, POST } = await import("../app/api/whatsapp/webhook/route");
const { proxy } = await import("../proxy");
const { NextRequest } = await import("next/server");
const secret = "test-secret-whatsapp-not-a-real-credential";
const recipient = "5511999990000";
before(async () => {
  await migrate();
  await db`DELETE FROM whatsapp_test_sends`;
  Object.assign(process.env, { WHATSAPP_MODE: "test", WHATSAPP_APP_SECRET: secret,
    WHATSAPP_VERIFY_TOKEN: "verify-token-only-for-tests-1234567890", WHATSAPP_PHONE_NUMBER_ID: "123456789",
    WHATSAPP_WABA_ID: "987654321", WHATSAPP_TEST_RECIPIENTS: recipient,
    WHATSAPP_ACCESS_TOKEN: "fake-token-never-sent-to-meta", WHATSAPP_GRAPH_VERSION: "v23.0" });
});
after(() => db.end());
const sign = (body: string) => "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
const event = (from = recipient, time = Math.floor(Date.now() / 1000)) => ({ object: "whatsapp_business_account", entry: [{ id: "987654321", changes: [{ field: "messages", value: {
  messaging_product: "whatsapp", metadata: { phone_number_id: "123456789" },
  messages: [{ from, id: "wamid." + randomUUID(), timestamp: String(time), type: "text", text: { body: "TESTE: torneira pingando" } }],
} }] }] });
test("webhook verification requires exact token and valid challenge; proxy permits only webhook without visitor login", async () => {
  const endpoint = "https://descomplica-guaruja-homolog.vercel.app/api/whatsapp/webhook";
  const p = new URLSearchParams({ "hub.mode": "subscribe", "hub.verify_token": process.env.WHATSAPP_VERIFY_TOKEN!, "hub.challenge": "123456" });
  assert.equal(verifyChallenge(endpoint + "?" + p), "123456");
  assert.equal((await GET(new Request(endpoint + "?" + p))).status, 200);
  p.set("hub.verify_token", "wrong");
  assert.equal((await GET(new Request(endpoint + "?" + p))).status, 403);
  const mode = process.env.APP_MODE, origin = process.env.APP_ORIGIN;
  process.env.APP_MODE = "staging-test"; process.env.APP_ORIGIN = new URL(endpoint).origin;
  try {
    assert.equal(proxy(new NextRequest(endpoint, { headers: { host: new URL(endpoint).host } })).status, 200);
    assert.equal(proxy(new NextRequest(new URL("/api/private", endpoint), { headers: { host: new URL(endpoint).host } })).status, 401);
  } finally { process.env.APP_MODE = mode; process.env.APP_ORIGIN = origin; }
});
test("signed webhook persists encrypted events once, rejects tampering and bounds input", async () => {
  const data = event(), raw = JSON.stringify(data), id = data.entry[0].changes[0].value.messages[0].id;
  await assert.rejects(receiveWhatsApp(raw, sign(raw + "!")), /Assinatura/);
  const results = await Promise.all([receiveWhatsApp(raw, sign(raw)), receiveWhatsApp(raw, sign(raw))]);
  assert.equal(results.reduce((a, b) => a + b, 0), 1);
  const [row] = await db`SELECT * FROM whatsapp_test_events WHERE message_id=${id}`;
  assert.ok(!row.payload_ciphertext.includes(recipient));
  assert.ok(!row.payload_ciphertext.includes("torneira"));
  await assert.rejects(db`UPDATE whatsapp_test_events SET kind='status' WHERE id=${row.id}`, /Histórico/);
  const events = await recentWhatsAppEvents();
  assert.ok(events.some(e => e.id === String(row.id) && e.payload.text === "TESTE: torneira pingando"));
  assert.equal((await POST(new Request("http://localhost/api/whatsapp/webhook", { method: "POST", body: "x".repeat(256001) }))).status, 413);
  assert.equal((await POST(new Request("http://localhost/api/whatsapp/webhook", { method: "POST", body: raw, headers: { "x-hub-signature-256": sign(raw) } }))).status, 200);
});
test("wrong WABA, wrong phone ID and unlisted senders are ignored; delivery statuses are durable", async () => {
  for (const mutation of ["waba", "phone", "sender"]) {
    const e = event(mutation === "sender" ? "5511888880000" : recipient);
    if (mutation === "waba") e.entry[0].id = "other";
    if (mutation === "phone") e.entry[0].changes[0].value.metadata.phone_number_id = "other";
    const raw = JSON.stringify(e);
    assert.equal(await receiveWhatsApp(raw, sign(raw)), 0);
  }
  const s = event();
  const value = s.entry[0].changes[0].value;
  const raw = JSON.stringify({ ...s, entry: [{ id: "987654321", changes: [{ field: "messages", value: {
    ...value, messages: [], statuses: [{ id: "wamid." + randomUUID(), recipient_id: recipient, timestamp: String(Math.floor(Date.now()/1000)), status: "delivered" }],
  } }] }] });
  assert.equal(await receiveWhatsApp(raw, sign(raw)), 1);
  assert.equal(await receiveWhatsApp(raw, sign(raw)), 0);
});
test("explicit test sends enforce allowlist, concurrent idempotency and no resend on ambiguous timeout", async () => {
  let calls = 0;
  const transport: typeof fetch = async (url, init) => {
    calls++; assert.equal(String(url), "https://graph.facebook.com/v23.0/123456789/messages");
    assert.equal(JSON.parse(init!.body as string).template.name, "hello_world");
    return Response.json({ messages: [{ id: "wamid.test-output" }] });
  };
  const input = { requestKey: randomUUID(), to: recipient, kind: "hello_world" };
  await assert.rejects(sendWhatsAppTest({ ...input, to: "5511888880000" }, transport), /lista/);
  const results = await Promise.all([sendWhatsAppTest(input, transport), sendWhatsAppTest(input, transport)]);
  assert.equal(calls, 1); assert.ok(results.some(r => r.state === "accepted"));
  await assert.rejects(sendWhatsAppTest({ ...input, text: "changed" }, transport), /outro conteúdo/);
  const retryInput = { ...input, requestKey: randomUUID() };
  const fail: typeof fetch = async () => { calls++; throw Error("timeout with sensitive body"); };
  assert.equal((await sendWhatsAppTest(retryInput, fail)).state, "unknown");
  assert.equal((await sendWhatsAppTest(retryInput, fail)).state, "unknown");
  assert.equal(calls, 2);
});
test("text requires incoming message inside window, limits daily sends and disabled mode blocks transport", async () => {
  const oldRecipients = process.env.WHATSAPP_TEST_RECIPIENTS;
  const freshRecipient = "5511" + randomInt(100000000, 999999999);
  process.env.WHATSAPP_TEST_RECIPIENTS = freshRecipient;
  let calls = 0;
  const transport: typeof fetch = async () => { calls++; return Response.json({ messages: [{ id: "wamid.text" }] }); };
  const input = { requestKey: randomUUID(), to: freshRecipient, kind: "text", text: "Resposta de teste" };
  await assert.rejects(sendWhatsAppTest(input, transport), /envie uma mensagem/);
  const old = JSON.stringify(event(input.to, Math.floor(Date.now()/1000)-86401));
  await receiveWhatsApp(old, sign(old));
  await assert.rejects(sendWhatsAppTest(input, transport), /envie uma mensagem/);
  const fresh = JSON.stringify(event(input.to));
  await receiveWhatsApp(fresh, sign(fresh));
  assert.equal((await sendWhatsAppTest(input, transport)).state, "accepted");
  await db`INSERT INTO whatsapp_test_sends(request_key,fingerprint,state) SELECT gen_random_uuid(),'limit-fixture','unknown' FROM generate_series(1,10)`;
  await assert.rejects(sendWhatsAppTest({ ...input, requestKey: randomUUID() }, transport), /Limite/);
  process.env.WHATSAPP_MODE = "disabled";
  await assert.rejects(sendWhatsAppTest(input, transport), /não ativado/);
  assert.equal(calls, 1);
  process.env.WHATSAPP_MODE = "test"; process.env.WHATSAPP_TEST_RECIPIENTS = oldRecipients;
});
