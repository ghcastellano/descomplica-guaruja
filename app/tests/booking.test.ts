import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
if (
  !process.env.TEST_DATABASE_URL ||
  new URL(process.env.TEST_DATABASE_URL).pathname !== "/descomplica_test"
)
  throw Error("Banco de teste isolado obrigatório.");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { db } = await import("../lib/db");
const { migrate } = await import("../scripts/migrate");
const { createRequest, releaseProposal, getProposal, reviseProposal } =
  await import("../lib/domain");
const {
  bookingContext,
  getAvailability,
  holdBooking,
  acceptBooking,
  recordSimulatedPayment,
  listBookingsForStaff,
} = await import("../lib/booking");
before(async () => {
  await migrate();
  await db`UPDATE bookings SET status='expired' WHERE status IN ('held','awaiting_deposit','confirmed','fully_paid')`;
});
after(async () => {
  await db.end();
});
function date(days: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(Date.now() + days * 86400000);
}
async function proposal(period = "flexivel", packageId = "adois_ess") {
  const r = await createRequest({
    requestKey: randomUUID(),
    name: "Reserva fictícia",
    contact: "booking@example.invalid",
    packageId,
    guests: 2,
    location: "ajuda",
    place: "",
    period,
    budget: 500,
    notes: "NAO_EXIBIR_HISTORIA",
  });
  await releaseProposal(r.id, 1);
  const p = await getProposal(r.id);
  assert.ok(p);
  return { id: r.id, token: new URL(p.message.url).pathname.split("/").pop()! };
}
async function hold(
  p: { token: string },
  days: number,
  locationId = "jardim-demo",
  label = "09:00",
) {
  const d = date(days),
    a = await getAvailability(p.token, { date: d, locationId }),
    s = a.slots.find((x) => x.label === label);
  assert.ok(s);
  return holdBooking(p.token, { date: d, locationId, startAt: s.startAt });
}
test("agenda permite só locais/horários de teste, respeita período e duração", async () => {
  const p = await proposal("tarde"),
    ctx = await bookingContext(p.token);
  assert.equal(ctx.durationMinutes, 90);
  assert.equal(ctx.locations.length, 2);
  assert.equal(ctx.conditions.testOnly, true);
  const a = await getAvailability(p.token, {
    date: date(8),
    locationId: "jardim-demo",
  });
  assert.deepEqual(
    a.slots.map((x) => x.label),
    ["14:00"],
  );
  assert.equal(
    new Date(a.slots[0].endAt).getTime() -
      new Date(a.slots[0].startAt).getTime(),
    90 * 60000,
  );
  await assert.rejects(
    getAvailability(p.token, { date: date(8), locationId: "tombo" }),
  );
  await assert.rejects(
    getAvailability(p.token, { date: date(1), locationId: "jardim-demo" }),
  );
  await assert.rejects(
    getAvailability(p.token, { date: "2026-02-31", locationId: "jardim-demo" }),
  );
  await assert.rejects(
    holdBooking(p.token, {
      date: date(8),
      locationId: "jardim-demo",
      startAt: new Date(Date.now() + 8 * 86400000).toISOString(),
    }),
    { status: 422 },
  );
  const n = await proposal("noite");
  assert.equal(
    (
      await getAvailability(n.token, {
        date: date(8),
        locationId: "jardim-demo",
      })
    ).slots.length,
    0,
  );
  const luxury = await proposal("flexivel", "pedido_lux");
  assert.equal((await bookingContext(luxury.token)).durationMinutes, null);
  await assert.rejects(
    getAvailability(luxury.token, { date: date(8), locationId: "jardim-demo" }),
    { status: 409 },
  );
});
test("equipe única: duas propostas concorrentes, inclusive locais diferentes, não sobrepõem", async () => {
  const p = await proposal(),
    q = await proposal(),
    d = date(9);
  const [s] = (
    await getAvailability(p.token, { date: d, locationId: "jardim-demo" })
  ).slots;
  const results = await Promise.allSettled([
    holdBooking(p.token, {
      date: d,
      locationId: "jardim-demo",
      startAt: s.startAt,
    }),
    holdBooking(q.token, {
      date: d,
      locationId: "coberto-demo",
      startAt: s.startAt,
    }),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    results.find((x) => x.status === "rejected")?.reason.status,
    409,
  );
  const winner = results[0].status === "fulfilled" ? p : q,
    locationId = winner === p ? "jardim-demo" : "coberto-demo";
  const first = results.find((x) => x.status === "fulfilled")!;
  const retry = await holdBooking(winner.token, {
    date: d,
    locationId,
    startAt: s.startAt,
  });
  assert.equal(retry.booking.id, first.value.booking.id);
  const loser = winner === p ? q : p;
  await assert.rejects(
    db`INSERT INTO bookings(id,proposal_id,proposal_version,status,location_id,start_at,end_at,occupied_range,hold_expires_at,total_cents,deposit_cents,balance_cents,balance_due_at) SELECT ${randomUUID()},${loser.id},1,'held',location_id,start_at,end_at,occupied_range,hold_expires_at,total_cents,deposit_cents,balance_cents,balance_due_at FROM bookings WHERE id=${retry.booking.id}`,
    { code: "23P01" },
  );
});
test("buffers de montagem e desmontagem impedem intervalo seguinte sobreposto", async () => {
  const p = await proposal("flexivel", "adois_lux"),
    q = await proposal();
  await hold(p, 10, "jardim-demo", "14:00");
  const available = await getAvailability(q.token, {
    date: date(10),
    locationId: "coberto-demo",
  });
  assert.ok(!available.slots.some((x) => x.label === "17:00"));
  assert.ok(available.slots.some((x) => x.label === "09:00"));
});
test("hold expirado é liberado atomicamente; tentativa de sinal tardio não registra pagamento", async () => {
  const p = await proposal(),
    q = await proposal(),
    held = await hold(p, 11);
  await acceptBooking(p.token, {
    bookingId: held.booking.id,
    termsAccepted: true,
  });
  await db`UPDATE bookings SET hold_expires_at=now()-interval '1 second' WHERE id=${held.booking.id}`;
  const replacement = await hold(q, 11);
  assert.notEqual(replacement.booking.id, held.booking.id);
  await assert.rejects(
    recordSimulatedPayment({
      bookingId: held.booking.id,
      kind: "deposit",
      eventKey: randomUUID(),
    }),
    { status: 409 },
  );
  const [count] =
    await db`SELECT count(*)::int AS n FROM booking_payments WHERE booking_id=${held.booking.id}`;
  assert.equal(count.n, 0);
  assert.equal((await bookingContext(p.token)).booking?.status, "expired");
});
test("aceite obrigatório, valores servidor, sinal idempotente e saldo só após sinal", async () => {
  const p = await proposal(),
    held = await hold(p, 12);
  await assert.rejects(
    acceptBooking(p.token, {
      bookingId: held.booking.id,
      termsAccepted: false,
    }),
  );
  await assert.rejects(
    recordSimulatedPayment({
      bookingId: held.booking.id,
      kind: "deposit",
      eventKey: randomUUID(),
    }),
    { status: 409 },
  );
  await assert.rejects(
    recordSimulatedPayment({
      bookingId: held.booking.id,
      kind: "balance",
      eventKey: randomUUID(),
    }),
    { status: 409 },
  );
  const accepted = await acceptBooking(p.token, {
    bookingId: held.booking.id,
    termsAccepted: true,
  });
  assert.equal(accepted.booking.status, "awaiting_deposit");
  assert.equal(accepted.booking.termsVersion, "demo-v1");
  assert.equal(
    accepted.booking.depositCents,
    Math.ceil(accepted.booking.totalCents / 2),
  );
  assert.equal(
    new Date(accepted.booking.startAt).getTime() -
      new Date(accepted.booking.balanceDueAt).getTime(),
    72 * 3600000,
  );
  const eventKey = randomUUID(),
    results = await Promise.all([
      recordSimulatedPayment({
        bookingId: held.booking.id,
        kind: "deposit",
        eventKey,
      }),
      recordSimulatedPayment({
        bookingId: held.booking.id,
        kind: "deposit",
        eventKey,
      }),
    ]);
  assert.equal(results.filter((x) => !x.duplicate).length, 1);
  assert.equal(results[0].booking.status, "confirmed");
  const [access] =
    await db`SELECT l.expires_at,b.end_at FROM proposal_links l JOIN bookings b ON b.proposal_id=l.proposal_id AND b.proposal_version=l.version WHERE b.id=${held.booking.id} AND l.revoked_at IS NULL`;
  assert.ok(
    new Date(access.expires_at).getTime() >=
      new Date(access.end_at).getTime() + 7 * 86400000,
  );

  const settled = await recordSimulatedPayment({
    bookingId: held.booking.id,
    kind: "balance",
    eventKey: randomUUID(),
  });
  assert.equal(settled.booking.status, "fully_paid");
  assert.equal(settled.booking.paidCents, settled.booking.totalCents);
  const [payments] =
    await db`SELECT count(*)::int AS n FROM booking_payments WHERE booking_id=${held.booking.id}`;
  assert.equal(payments.n, 2);
  const [notifications] =
    await db`SELECT count(*)::int AS n FROM booking_notifications WHERE booking_id=${held.booking.id}`;
  assert.equal(notifications.n, 8);
  const dto = await bookingContext(p.token);
  assert.ok(!JSON.stringify(dto).includes("NAO_EXIBIR_HISTORIA"));
  for (const key of [
    "internalNote",
    "contact",
    "accepted_snapshot",
    "token_hash",
    "proposalId",
  ])
    assert.ok(!JSON.stringify(dto).includes(key));
  const staff = (await listBookingsForStaff()).find(
    (b) => b.id === held.booking.id,
  );
  assert.ok(staff);
  assert.equal(staff.notifications.length, 8);
  assert.ok(staff.notifications.every((n) => n.text.includes("SIMULAÇÃO")));
  await assert.rejects(
    db`UPDATE booking_payments SET amount_cents=1 WHERE booking_id=${held.booking.id}`,
    /Histórico imutável/,
  );
  await assert.rejects(
    db`UPDATE bookings SET total_cents=1 WHERE id=${held.booking.id}`,
    /Condições aceitas são imutáveis/,
  );
  await assert.rejects(
    db`DELETE FROM booking_notifications WHERE booking_id=${held.booking.id}`,
    /Histórico imutável/,
  );
});
test("token antigo e aceite de reserva alheia são recusados", async () => {
  const p = await proposal(),
    old = await getProposal(p.id);
  assert.ok(old);
  await reviseProposal(p.id, 1, old.snapshot);
  await assert.rejects(bookingContext(p.token), { status: 404 });
  await assert.rejects(
    getAvailability(p.token, { date: date(13), locationId: "jardim-demo" }),
    { status: 404 },
  );
  const q = await proposal(),
    r = await proposal(),
    held = await hold(q, 13);
  await assert.rejects(
    acceptBooking(r.token, { bookingId: held.booking.id, termsAccepted: true }),
    { status: 404 },
  );
});
test("proposta com pré-reserva ativa não pode mudar a versão", async () => {
  const p = await proposal(),
    held = await hold(p, 14),
    current = await getProposal(p.id);
  assert.ok(current);
  await assert.rejects(reviseProposal(p.id, 1, current.snapshot), {
    status: 409,
  });
  await db`UPDATE bookings SET hold_expires_at=now()-interval '1 second' WHERE id=${held.booking.id}`;
  const revised = await reviseProposal(p.id, 1, current.snapshot);
  assert.equal(revised.version, 2);
});

test("centavos ímpares são divididos no servidor e chave de sinal não pode pagar saldo", async () => {
  const p = await proposal(),
    draft = await getProposal(p.id);
  assert.ok(draft);
  await reviseProposal(p.id, 1, { ...draft.snapshot, amountCents: 39901 });
  await releaseProposal(p.id, 2);
  const updated = await getProposal(p.id);
  assert.ok(updated);
  p.token = new URL(updated.message.url).pathname.split("/").pop()!;
  const h = await hold(p, 15);
  assert.equal(h.booking.depositCents, 19951);
  assert.equal(h.booking.balanceCents, 19950);
  await acceptBooking(p.token, {
    bookingId: h.booking.id,
    termsAccepted: true,
  });
  const eventKey = randomUUID();
  await recordSimulatedPayment({
    bookingId: h.booking.id,
    kind: "deposit",
    eventKey,
  });
  await assert.rejects(
    recordSimulatedPayment({
      bookingId: h.booking.id,
      kind: "balance",
      eventKey,
    }),
    { status: 409 },
  );
});

test("duração explicitamente removida bloqueia agenda; só revisões antigas sem o campo usam catálogo", async () => {
  const p = await proposal("flexivel", "adois_ess"),
    original = await getProposal(p.id);
  assert.ok(original);
  await reviseProposal(p.id, 1, {
    ...original.snapshot,
    durationMinutes: null,
  });
  await releaseProposal(p.id, 2);
  const cleared = await getProposal(p.id);
  assert.ok(cleared);
  p.token = new URL(cleared.message.url).pathname.split("/").pop()!;
  assert.equal((await bookingContext(p.token)).durationMinutes, null);
  await assert.rejects(
    getAvailability(p.token, { date: date(16), locationId: "jardim-demo" }),
    { status: 409 },
  );
  await assert.rejects(
    holdBooking(p.token, {
      date: date(16),
      locationId: "jardim-demo",
      startAt: new Date(date(16) + "T09:00:00-03:00").toISOString(),
    }),
    { status: 409 },
  );
  const { durationMinutes, ...legacy } = original.snapshot;
  await reviseProposal(p.id, 2, legacy);
  await releaseProposal(p.id, 3);
  const restored = await getProposal(p.id);
  assert.ok(restored);
  p.token = new URL(restored.message.url).pathname.split("/").pop()!;
  assert.equal((await bookingContext(p.token)).durationMinutes, 90);
  assert.ok(
    (
      await getAvailability(p.token, {
        date: date(16),
        locationId: "jardim-demo",
      })
    ).slots.length > 0,
  );
});
