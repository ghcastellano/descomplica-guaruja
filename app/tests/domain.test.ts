import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
if (
  !process.env.TEST_DATABASE_URL ||
  new URL(process.env.TEST_DATABASE_URL).pathname !== "/descomplica_test"
)
  throw Error("Testes exigem o banco isolado descomplica_test.");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { db } = await import("../lib/db");
const { migrate } = await import("../scripts/migrate");
const {
  createRequest,
  getProposal,
  reviseProposal,
  releaseProposal,
  clientProposal,
} = await import("../lib/domain");
const { session, validSession } = await import("../lib/crypto");
before(async () => {
  await migrate();
});
after(async () => {
  await db.end();
});
const request = () => ({
  requestKey: randomUUID(),
  name: "Teste automatizado",
  contact: "ficticio@example.invalid",
  packageId: "adois_ess",
  guests: 2,
  location: "praia",
  place: "Tombo (preferência)",
  period: "tarde",
  budget: 500,
  notes: "História privada de teste",
});
test("capacidade validada no servidor: A Dois somente 2, demais até 8", async () => {
  await assert.rejects(createRequest({ ...request(), guests: 3 }));
  await assert.rejects(
    createRequest({ ...request(), packageId: "amigas_ess", guests: 9 }),
  );
  const r = await createRequest({
    ...request(),
    packageId: "amigas_ess",
    guests: 8,
  });
  assert.ok(r.id);
});
test("envios concorrentes são idempotentes, payload diferente com mesma chave falha", async () => {
  const input = request(),
    results = await Promise.all(
      Array.from({ length: 5 }, () => createRequest(input)),
    );
  assert.equal(new Set(results.map((x) => x.id)).size, 1);
  assert.equal(results.filter((x) => !x.duplicate).length, 1);
  await assert.rejects(createRequest({ ...input, name: "Outro nome" }), {
    status: 409,
  });
  const p = await getProposal(results[0].id);
  assert.equal(p?.events.length, 1);
  assert.equal(p?.version, 1);
});
test("rascunho determinístico usa média da faixa e precisa de aprovação", async () => {
  const r = await createRequest(request()),
    p = await getProposal(r.id);
  assert.equal(p?.snapshot.amountCents, (await import("../lib/pricing")).priceWithStripe(39900));
  assert.equal(p?.status, "draft");
  assert.equal(p?.message, null);
});
test("liberação concorrente gera um link/outbox; revisão revoga link e exige nova aprovação", async () => {
  const r = await createRequest(request());
  const results = await Promise.all([
    releaseProposal(r.id, 1),
    releaseProposal(r.id, 1),
  ]);
  assert.equal(results.filter((x) => !x.duplicate).length, 1);
  const p = await getProposal(r.id);
  assert.ok(p);
  const token = new URL(p.message!.url).pathname.split("/").pop()!;
  const dto = await clientProposal(token);
  assert.ok(dto);
  assert.equal(dto.guests, 2);
  for (const forbidden of [
    "internalNote",
    "contact",
    "notes",
    "briefing",
    "fingerprint",
    "name",
    "message",
  ])
    assert.equal(forbidden in dto, false);
  assert.ok(!JSON.stringify(dto).includes("História privada"));
  const [out] =
    await db`SELECT count(*)::int AS n FROM outbox WHERE proposal_id=${r.id}`;
  assert.equal(out.n, 1);
  const revised = await reviseProposal(r.id, 1, {
    ...p.snapshot,
    amountCents: 42000,
    internalNote: "SEGREDO_INTERNO",
  });
  assert.equal(revised.version, 2);
  assert.equal(await clientProposal(token), null);
  await assert.rejects(releaseProposal(r.id, 1), { status: 409 });
  await assert.rejects(reviseProposal(r.id, 1, p.snapshot), { status: 409 });
  await releaseProposal(r.id, 2);
  const p2 = await getProposal(r.id);
  assert.ok(p2);
  assert.notEqual(p2.message!.url, p.message!.url);
  const dto2 = await clientProposal(
    new URL(p2.message!.url).pathname.split("/").pop()!,
  );
  assert.ok(dto2);
  assert.equal(dto2.amountCents, 42000);
  assert.ok(!JSON.stringify(dto2).includes("SEGREDO_INTERNO"));
  assert.equal(p2.events.length, 4);
  assert.equal(p2.revisions.length, 2);
  assert.equal(p2.revisions[1].snapshot.amountCents, p.snapshot.amountCents);
});
test("duas revisões da mesma versão: uma vence, a outra recebe conflito", async () => {
  const r = await createRequest(request()),
    p = await getProposal(r.id);
  assert.ok(p);
  const results = await Promise.allSettled([
    reviseProposal(r.id, 1, { ...p.snapshot, amountCents: 50000 }),
    reviseProposal(r.id, 1, { ...p.snapshot, amountCents: 60000 }),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  const fail = results.find((x) => x.status === "rejected");
  assert.equal(fail?.reason.status, 409);
});
test("histórico e snapshots recusam alteração e exclusão", async () => {
  const r = await createRequest(request());
  await assert.rejects(
    db`UPDATE audit_events SET actor='Alterado' WHERE proposal_id=${r.id}`,
    /Histórico imutável/,
  );
  await assert.rejects(
    db`DELETE FROM proposal_revisions WHERE proposal_id=${r.id}`,
    /Histórico imutável/,
  );
});
test("links expirados e tokens inválidos não expõem dados", async () => {
  assert.equal(await clientProposal("invalido"), null);
  const r = await createRequest(request());
  await releaseProposal(r.id, 1);
  const p = await getProposal(r.id);
  assert.ok(p);
  await db`UPDATE proposal_links SET expires_at=now()-interval '1 second' WHERE proposal_id=${r.id}`;
  assert.equal(
    await clientProposal(new URL(p.message!.url).pathname.split("/").pop()!),
    null,
  );
});
test("sessão rejeita assinatura adulterada e expiração", () => {
  const value = session();
  assert.equal(validSession(value), true);
  assert.equal(validSession(value + "a"), false);
  assert.equal(validSession("0.invalid"), false);
});
