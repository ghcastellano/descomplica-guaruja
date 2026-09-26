import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
if (
  !process.env.TEST_DATABASE_URL ||
  new URL(process.env.TEST_DATABASE_URL).pathname != "/descomplica_test"
)
  throw Error("Banco de teste obrigatório");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { db } = await import("../lib/db");
const { migrate } = await import("../scripts/migrate");
const { createInquiry, getInquiry, qualifyInquiry, getProposal, listRequests } =
  await import("../lib/domain");
before(migrate);
after(() => db.end());
const inquiry = () => ({
  requestKey: randomUUID(),
  name: "Conversa fictícia",
  contact: "conversa@example.invalid",
  source: "whatsapp_sophia",
  notes: "Mensagem original da conversa",
});
const brief = () => ({
  ...inquiry(),
  source: "outro",
  packageId: "amigas_ess",
  guests: 8,
  location: "ajuda",
  place: "",
  period: "flexivel",
  budget: 0,
  notes: "Dados organizados pela Sophia",
});
test("contato direto é idempotente, sem inventar experiência ou proposta", async () => {
  const input = inquiry();
  const a = await createInquiry(input),
    b = await createInquiry(input);
  assert.equal(a.id, b.id);
  assert.equal(b.duplicate, true);
  const row = await getInquiry(a.id);
  assert.equal(row?.proposal_id, null);
  assert.equal(row?.briefing.packageId, undefined);
  assert.equal(await getProposal(a.id), null);
  await assert.rejects(createInquiry({ ...input, name: "Outra pessoa" }), {
    status: 409,
  });
});
test("qualificação mantém protocolo, origem, mensagem original e uma única proposta", async () => {
  const a = await createInquiry(inquiry());
  const results = await Promise.allSettled([
    qualifyInquiry(a.id, brief()),
    qualifyInquiry(a.id, brief()),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  const p = await getProposal(a.id);
  assert.ok(p);
  assert.equal(p.version, 1);
  assert.equal(p.briefing.source, "whatsapp_sophia");
  assert.equal(p.briefing.guests, 8);
  assert.equal(
    p.events.find((e) => e.kind === "inquiry_created")?.details.briefing.notes,
    "Mensagem original da conversa",
  );
  const row = await getInquiry(a.id);
  assert.equal(row?.id, a.id);
  assert.equal(row?.number, p.number);
  const found = await listRequests("conversa@example.invalid");
  assert.ok(found.some((r) => r.id === a.id));
});
test("campos essenciais continuam obrigatórios ao qualificar", async () => {
  const a = await createInquiry(inquiry());
  await assert.rejects(qualifyInquiry(a.id, { ...brief(), packageId: "" }));
  await assert.rejects(qualifyInquiry(a.id, { ...brief(), guests: 9 }));
  assert.equal(await getProposal(a.id), null);
});
