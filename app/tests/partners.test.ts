import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { partnerTerms } from "../lib/service-catalog";
import { hash } from "../lib/crypto";
const u = new URL(process.env.DATABASE_URL!);
if (u.hostname !== "127.0.0.1" || u.pathname !== "/descomplica_test")
  throw Error("Isolated local DB required");
const { db } = await import("../lib/db");
const { migrate } = await import("../scripts/migrate");
const {
  applyPartner,
  createProspect,
  publicPartner,
  reviewPartner,
  getPartner,
  updatePartnerPermission,
  partnerApplicationSchema,
} = await import("../lib/partners");
const { citySchema } = await import("../lib/city");
before(migrate);
after(() => db.end());
const application = () => ({
  requestKey: randomUUID(),
  name: "TESTE REDE",
  contact: "teste@example.invalid",
  serviceIds: ["torneira"],
  areas: "Tombo e Astúrias",
  availability: "Manhã nos dias úteis",
  description: "Experiência em reparos hidráulicos residenciais.",
  termsVersion: partnerTerms.version,
  accepted: true,
  adult: true,
  publishPermission: false,
  whatsappPermission: false,
});
const token = (url: string) => url.split("/").at(-1)!;
async function rowFor(t: string) {
  const [r] =
    await db`SELECT * FROM network_partners WHERE token_hash=${hash(t)}`;
  return r;
}
test("separate optional permissions; explicit current terms and adult declaration required", () => {
  const v = application();
  assert.ok(partnerApplicationSchema.parse(v));
  for (const mutation of [
    { accepted: false },
    { adult: false },
    { termsVersion: "old" },
    { serviceIds: ["invented"] },
    { serviceIds: [] },
    { whatsappPermission: undefined },
    { whatsappPermission: true },
  ])
    assert.throws(() => partnerApplicationSchema.parse({ ...v, ...mutation }));
});
test("voluntary application is idempotent, stores immutable exact terms, does not publish", async () => {
  const input = application();
  const results = await Promise.all(
    Array.from({ length: 4 }, () => applyPartner(input, randomUUID())),
  );
  assert.equal(new Set(results.map((r) => r.url)).size, 1);
  const t = token(results[0].url),
    r = await rowFor(t),
    p = await publicPartner(t);
  assert.equal(r.status, "pending");
  assert.equal(p?.publishPermission, false);
  assert.equal(p?.whatsappPermission, false);
  const [event] =
    await db`SELECT * FROM network_partner_events WHERE partner_id=${r.id} AND kind='application'`;
  assert.equal(event.details.termsText, partnerTerms.paragraphs.join("\n\n"));
  assert.equal(event.details.termsHash, hash(event.details.termsText));
  assert.equal(event.details.identityVerified, false);
  assert.ok(!JSON.stringify(p).includes(input.contact));
  assert.ok(!JSON.stringify(p).includes(input.name));
  assert.ok(!JSON.stringify(p).includes("actorHash"));
  await assert.rejects(applyPartner({ ...input, name: "Other" }), {
    status: 409,
  });
  await assert.rejects(
    db`UPDATE network_partner_events SET kind='tampered' WHERE id=${event.id}`,
  );
  await assert.rejects(
    db`DELETE FROM network_partner_events WHERE id=${event.id}`,
  );
});
test("internal prospect -> prepared invite -> explicit acceptance -> review -> qualification is not activation", async () => {
  const input = {
    requestKey: randomUUID(),
    name: "TESTE INDICAÇÃO",
    contact: "indicacao@example.invalid",
    source: "Indicação voluntária de teste",
  };
  const a = await createProspect(input),
    t = token(a.url);
  assert.equal(await publicPartner(t), null);
  await assert.rejects(
    applyPartner({ ...application(), token: t }, randomUUID()),
    { status: 409 },
  );
  await reviewPartner(a.id, {
    version: 1,
    status: "invited",
    note: "Convite preparado para apresentação autorizada.",
    verified: false,
  });
  const applied = await applyPartner(
    {
      ...application(),
      token: t,
      contact: "(13) 99999-0000",
      publishPermission: true,
      whatsappPermission: true,
    },
    randomUUID(),
  );
  assert.equal(applied.url, a.url);
  assert.equal((await createProspect(input)).id, a.id); // retry remains same even after acceptance
  let r = await getPartner(a.id);
  assert.equal(r?.status, "pending");
  await assert.rejects(
    reviewPartner(a.id, {
      version: r!.version,
      status: "qualified",
      note: "Ignorando avaliação.",
      verified: true,
    }),
    { status: 422 },
  );
  await reviewPartner(a.id, {
    version: r!.version,
    status: "reviewing",
    note: "Contato em conferência e serviços em análise.",
    verified: false,
  });
  r = await getPartner(a.id);
  await assert.rejects(
    reviewPartner(a.id, {
      version: r!.version,
      status: "qualified",
      note: "Ainda não conferi contato.",
      verified: false,
    }),
    { status: 422 },
  );
  await reviewPartner(a.id, {
    version: r!.version,
    status: "qualified",
    note: "Contato e especialidades confirmados em conversa de teste.",
    verified: true,
  });
  assert.equal((await publicPartner(t))?.status, "qualified");
  const p = await publicPartner(t);
  await updatePartnerPermission(t, {
    version: p!.version,
    withdraw: false,
    publishPermission: false,
    whatsappPermission: false,
  });
  assert.equal((await publicPartner(t))?.whatsappPermission, false);
  await assert.rejects(
    updatePartnerPermission(t, {
      version: p!.version,
      withdraw: false,
      publishPermission: true,
      whatsappPermission: true,
    }),
    { status: 409 },
  );
  const current = await publicPartner(t);
  await updatePartnerPermission(t, {
    version: current!.version,
    withdraw: true,
    publishPermission: true,
    whatsappPermission: true,
  });
  const ended = await publicPartner(t);
  assert.equal(ended?.status, "withdrawn");
  assert.equal(ended?.publishPermission, false);
  assert.equal(ended?.whatsappPermission, false);
});
test("declining invite requires no registration; expired tokens cannot change participation", async () => {
  const p = await createProspect({
    requestKey: randomUUID(),
    name: "TESTE RECUSA",
    contact: "recusa@example.invalid",
    source: "Teste de convite com recusa",
  });
  const t = token(p.url);
  await reviewPartner(p.id, {
    version: 1,
    status: "invited",
    note: "Preparado para testar a recusa voluntária.",
    verified: false,
  });
  await updatePartnerPermission(t, {
    version: 2,
    withdraw: true,
    publishPermission: false,
    whatsappPermission: false,
  });
  assert.equal((await publicPartner(t))?.status, "withdrawn");
  await assert.rejects(
    applyPartner({ ...application(), token: t }, randomUUID()),
    { status: 409 },
  );
  await db`UPDATE network_partners SET expires_at=now()-interval '1 second' WHERE id=${p.id}`;
  assert.equal(await publicPartner(t), null);
  await assert.rejects(
    updatePartnerPermission(t, {
      version: 3,
      withdraw: false,
      publishPermission: true,
      whatsappPermission: true,
    }),
    { status: 404 },
  );
});
test("targeted service briefing rejects mismatched service, missing or excessive answers", () => {
  const input = {
    requestKey: randomUUID(),
    vertical: "resolver",
    category: "Hidráulica",
    description: "Torneira pingando na cozinha",
    neighborhood: "Tombo",
    period: "manha",
    preferredDate: "",
    name: "Teste",
    contact: "teste@example.invalid",
    consent: true,
    serviceId: "torneira",
    serviceAnswers: ["Na cozinha, pinga", "Preciso de reparo"],
  };
  assert.ok(citySchema.parse(input));
  for (const m of [
    { category: "Elétrica" },
    { serviceId: "invented" },
    { serviceAnswers: undefined },
    { serviceAnswers: ["a", "b"] },
    { serviceAnswers: ["teste", "teste", "extra"] },
  ])
    assert.throws(() => citySchema.parse({ ...input, ...m }));
});
