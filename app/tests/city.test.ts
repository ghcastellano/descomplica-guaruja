import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const url = new URL(process.env.DATABASE_URL!);
if (url.hostname !== "127.0.0.1" || url.pathname !== "/descomplica_test")
  throw Error("Somente banco de testes local.");
const { db } = await import("../lib/db");
const { migrate } = await import("../scripts/migrate");
const {
  createCityRequest,
  getPublicCityRequest,
  updateCityRequest,
  getCityRequest,
  prepareExperience,
  citySchema,
} = await import("../lib/city");
const { suggestVertical } = await import("../lib/city-catalog");
before(async () => {
  await migrate();
});
after(async () => {
  await db.end();
});
const input = () => ({
  requestKey: randomUUID(),
  vertical: "resolver",
  category: "Limpeza",
  description: "Preciso preparar a casa para minha chegada.",
  neighborhood: "Astúrias",
  preferredDate: "",
  period: "flexivel",
  name: "Teste local",
  contact: "teste@example.invalid",
  consent: true,
});
async function getId(key: string) {
  const [r] = await db`SELECT id FROM city_requests WHERE request_key=${key}`;
  return r.id;
}
test("capacidade, categoria e consentimento são validados pelo servidor", () => {
  assert.throws(() => citySchema.parse({ ...input(), consent: false }));
  assert.throws(() =>
    citySchema.parse({ ...input(), category: "inexistente" }),
  );
  assert.throws(() =>
    citySchema.parse({
      ...input(),
      vertical: "experiencias",
      category: "A Dois",
      guests: 8,
    }),
  );
  assert.ok(
    citySchema.parse({
      ...input(),
      vertical: "experiencias",
      category: "Celebrar",
      guests: 8,
    }),
  );
  assert.throws(() => citySchema.parse({ ...input(), contact: "x" }));
  assert.equal(suggestVertical("um momento a dois"), "experiencias");
});
test("retry concorrente cria um pedido e um evento, payload diferente não sobrescreve", async () => {
  const b = input();
  const results = await Promise.all(
    Array.from({ length: 4 }, () => createCityRequest(b)),
  );
  assert.equal(new Set(results.map((r) => r.url)).size, 1);
  assert.equal(results.filter((r) => !r.duplicate).length, 1);
  await assert.rejects(createCityRequest({ ...b, name: "Outro nome" }), {
    status: 409,
  });
  const r = await getCityRequest(await getId(b.requestKey));
  assert.equal(r!.events.length, 1);
});
test("link público exclui contato e notas internas; token inválido não abre pedido", async () => {
  const b = input(),
    res = await createCityRequest(b),
    id = await getId(b.requestKey);
  await updateCityRequest(id, {
    version: 1,
    status: "reviewing",
    publicNote: "A equipe está avaliando seu pedido.",
    internalNote: "CUSTO_PRIVADO_900",
  });
  const r = await getPublicCityRequest(res.url.split("/").pop()!);
  assert.equal(r!.status, "reviewing");
  const serialized = JSON.stringify(r);
  for (const privateValue of [b.contact, b.name, "CUSTO_PRIVADO_900"])
    assert.ok(!serialized.includes(privateValue));
  assert.equal(await getPublicCityRequest("x".repeat(43)), null);
});
test("edição concorrente rejeita versão antiga e encerramento não é reversível", async () => {
  const b = input();
  await createCityRequest(b);
  const id = await getId(b.requestKey);
  await assert.rejects(
    updateCityRequest(id, {
      version: 1,
      status: "completed",
      publicNote: "Encerramento inválido",
      internalNote: "",
    }),
    { status: 422 },
  );
  await updateCityRequest(id, {
    version: 1,
    status: "reviewing",
    publicNote: "Pedido em análise.",
    internalNote: "",
  });
  await assert.rejects(
    updateCityRequest(id, {
      version: 1,
      status: "cancelled",
      publicNote: "Versão antiga",
      internalNote: "",
    }),
    { status: 409 },
  );
  await updateCityRequest(id, {
    version: 2,
    status: "completed",
    publicNote: "Atendimento concluído.",
    internalNote: "",
  });
  await assert.rejects(
    updateCityRequest(id, {
      version: 3,
      status: "reviewing",
      publicNote: "Reabrir atendimento",
      internalNote: "",
    }),
    { status: 422 },
  );
});
test("ponte de experiência é atômica e idempotente, preservando os detalhes", async () => {
  const b = {
    ...input(),
    vertical: "experiencias",
    category: "A Dois",
    guests: 2,
  };
  await createCityRequest(b);
  const id = await getId(b.requestKey);
  const [a, c] = await Promise.all([
    prepareExperience(id),
    prepareExperience(id),
  ]);
  assert.equal(a.id, c.id);
  const [r] = await db`SELECT briefing FROM requests WHERE id=${a.id}`;
  assert.equal(r.briefing.contact, b.contact);
  assert.ok(r.briefing.notes.includes("2 pessoas"));
  assert.ok(r.briefing.notes.includes(b.description));
  const city = await getCityRequest(id);
  assert.equal(
    city!.events.filter((e) => e.kind === "experience_planning").length,
    1,
  );
});
test("serviços e parcerias não entram indevidamente na agenda de experiências", async () => {
  const b = input();
  await createCityRequest(b);
  await assert.rejects(prepareExperience(await getId(b.requestKey)), {
    status: 422,
  });
});
test("histórico resiste a alteração e exclusão SQL", async () => {
  const b = input();
  await createCityRequest(b);
  const id = await getId(b.requestKey);
  await assert.rejects(
    db`UPDATE city_request_events SET public_note='alterado' WHERE request_id=${id}`,
  );
  await assert.rejects(
    db`DELETE FROM city_request_events WHERE request_id=${id}`,
  );
});
test("link de acompanhamento só oferece proposta atual, liberada e válida", async () => {
  const { qualifyInquiry, releaseProposal, reviseProposal, getProposal } =
    await import("../lib/domain");
  const b = {
    ...input(),
    vertical: "experiencias",
    category: "A Dois",
    guests: 2,
  };
  const received = await createCityRequest(b);
  const id = await getId(b.requestKey),
    linked = await prepareExperience(id),
    token = received.url.split("/").pop()!;
  assert.equal((await getPublicCityRequest(token))!.proposalPath, null);
  await qualifyInquiry(linked.id, {
    requestKey: randomUUID(),
    source: "questionario",
    name: b.name,
    contact: b.contact,
    packageId: "adois_ess",
    guests: 2,
    location: "ajuda",
    place: "",
    period: "flexivel",
    budget: 500,
    notes: "Teste da conexão entre fluxos",
  });
  await releaseProposal(linked.id, 1);
  assert.match(
    (await getPublicCityRequest(token))!.proposalPath!,
    /^\/p\/[\w-]{43}$/,
  );
  const p = await getProposal(linked.id);
  await reviseProposal(linked.id, 1, p!.snapshot);
  assert.equal((await getPublicCityRequest(token))!.proposalPath, null);
});
test('acesso convidado não concede sessão da equipe',async()=>{
 const {session,validSession}=await import('../lib/crypto');
 const invited=session('preview');assert.equal(validSession(invited),false);assert.equal(validSession(invited,'preview'),true);
 assert.throws(()=>citySchema.parse({...input(),preferredDate:'2026-02-31'}));
});

test("preferências chegam à qualificação e a ponte avança a etapa uma única vez", async () => {
  const { experiencePreferences, listCityRequests } = await import("../lib/city");
  const b = { ...input(), vertical: "experiencias", category: "Entre Amigas", guests: 8, period: "por-do-sol", preferredDate: "2027-01-12" };
  const created = await createCityRequest(b);
  const id = await getId(b.requestKey);
  const linked = await prepareExperience(id);
  assert.deepEqual(await experiencePreferences(linked.id), {
    guests: 8, place: b.neighborhood, period: "por-do-sol", collection: b.category, preferredDate: b.preferredDate,
  });
  const row = await getCityRequest(id);
  assert.equal(row!.status, "reviewing");
  assert.equal(row!.version, 2);
  await prepareExperience(id);
  assert.equal((await getCityRequest(id))!.version, 2);
  assert.equal((await listCityRequests(created.protocol, "reviewing"))[0].id, id);
  assert.equal((await listCityRequests(created.protocol, "received")).length, 0);
  assert.equal((await listCityRequests("%")).length, 0);
});

test("link entre ambientes e acompanhamento da reserva refletem pagamentos sem expor dados internos", async () => {
  const { qualifyInquiry, releaseProposal, getProposal } = await import("../lib/domain");
  const { holdBooking, acceptBooking, getAvailability, recordSimulatedPayment } = await import("../lib/booking");
  const b = { ...input(), vertical: "experiencias", category: "A Dois", guests: 2 };
  const created = await createCityRequest(b), id = await getId(b.requestKey), linked = await prepareExperience(id);
  const token = created.url.split("/").pop()!;
  await qualifyInquiry(linked.id, { requestKey: randomUUID(), source: "questionario", name: b.name, contact: b.contact,
    packageId: "adois_ess", guests: 2, location: "ajuda", place: "", period: "flexivel", budget: 500, notes: "Teste interno" });
  const origin = process.env.APP_ORIGIN;
  try {
    process.env.APP_ORIGIN = origin === "http://127.0.0.1:3001" ? "http://127.0.0.1:3002" : "http://127.0.0.1:3001";
    await releaseProposal(linked.id, 1);
  } finally { process.env.APP_ORIGIN = origin; }
  const proposal = (await getProposal(linked.id))!;
  assert.equal(new URL(proposal.message!.url).origin, origin);
  assert.ok(proposal.message!.text.includes(proposal.message!.url));
  const publicView = (await getPublicCityRequest(token))!;
  assert.ok(publicView.proposalPath);
  const proposalToken = publicView.proposalPath!.split("/").pop()!;
  let available, selectedDate = "";
  for (let days = 20; days < 40; days++) {
    const date = new Date(Date.now() + days * 86400000).toISOString().slice(0,10);
    const result = await getAvailability(proposalToken, { locationId: "jardim-demo", date });
    if (result.slots.length) { available = result.slots[0]; selectedDate = date; break; }
  }
  assert.ok(available);
  const held = await holdBooking(proposalToken, { locationId: "jardim-demo", date: selectedDate, startAt: available.startAt });
  await acceptBooking(proposalToken, { bookingId: held.booking.id, termsAccepted: true });
  assert.equal((await getPublicCityRequest(token))!.booking!.status, "awaiting_deposit");
  await recordSimulatedPayment({ bookingId: held.booking.id, kind: "deposit", eventKey: randomUUID() });
  const paid = (await getPublicCityRequest(token))!;
  assert.equal(paid.booking!.status, "confirmed");
  assert.deepEqual(Object.keys(paid.booking!).sort(), ["paymentReview", "status"]);
  assert.ok(!JSON.stringify(paid).includes(b.contact));
});
