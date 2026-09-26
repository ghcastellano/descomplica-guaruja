import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
if (
  !process.env.TEST_DATABASE_URL ||
  new URL(process.env.TEST_DATABASE_URL).pathname !== "/descomplica_test"
)
  throw Error("Banco de teste isolado obrigatório.");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.STRIPE_SECRET_KEY = "sk_test_unitfixtureonly";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_unit_fixture_only";
const { db } = await import("../lib/db");
const { migrate } = await import("../scripts/migrate");
const { createRequest, releaseProposal, getProposal } =
  await import("../lib/domain");
const {
  getAvailability,
  holdBooking,
  acceptBooking,
  cancelBooking,
  bookingContext,
  recordSimulatedPayment,
} = await import("../lib/booking");
const {
  createStripeCheckout,
  getStripeMode,
  verifyStripeEvent,
  processStripeEvent,
} = await import("../lib/stripe");
const signing = new Stripe("sk_test_unitfixtureonly");
before(async () => {
  await migrate();
  await db`UPDATE bookings SET status='expired' WHERE status IN ('held','awaiting_deposit','confirmed','fully_paid')`;
});
after(async () => {
  await db.end();
});
async function prepared(days: number) {
  const r = await createRequest({
    requestKey: randomUUID(),
    name: "Stripe fictício",
    contact: "stripe@example.invalid",
    packageId: "adois_ess",
    guests: 2,
    location: "ajuda",
    place: "",
    period: "flexivel",
    budget: 500,
    notes: "",
  });
  await releaseProposal(r.id, 1);
  const p = await getProposal(r.id);
  assert.ok(p);
  const token = new URL(p.message.url).pathname.split("/").pop()!;
  const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(Date.now() + days * 86400000),
    [slot] = (await getAvailability(token, { date, locationId: "jardim-demo" }))
      .slots;
  assert.ok(slot);
  const { booking } = await holdBooking(token, {
    date,
    locationId: "jardim-demo",
    startAt: slot.startAt,
  });
  await acceptBooking(token, { bookingId: booking.id, termsAccepted: true });
  return { token, bookingId: booking.id, date, slot };
}
const calls: { params: Stripe.Checkout.SessionCreateParams; key: string }[] =
  [];
const sessions = new Map<string, Stripe.Checkout.Session>();
const mock = {
  create: async (params: Stripe.Checkout.SessionCreateParams, key: string) => {
    calls.push({ params, key });
    if (sessions.has(key)) return sessions.get(key)!;
    const id = "cs_test_" + randomUUID().replaceAll("-", "");
    const s = {
      id,
      object: "checkout.session",
      livemode: false,
      mode: "payment",
      status: "open",
      payment_status: "unpaid",
      currency: "brl",
      amount_total: params.line_items![0].price_data!.unit_amount,
      metadata: params.metadata,
      client_reference_id: params.client_reference_id,
      expires_at: params.expires_at,
      url: "https://checkout.stripe.com/c/pay/" + id,
      payment_intent: "pi_" + randomUUID().replaceAll("-", ""),
    } as unknown as Stripe.Checkout.Session;
    sessions.set(key, s);
    return s;
  },
};
function event(
  session: Stripe.Checkout.Session,
  type = "checkout.session.completed",
  id = "evt_" + randomUUID(),
): Stripe.Event {
  return {
    id,
    object: "event",
    type,
    livemode: false,
    created: Math.floor(Date.now() / 1000),
    data: { object: session },
  } as unknown as Stripe.Event;
}
function signed(e: Stripe.Event) {
  const raw = JSON.stringify(e);
  const header = signing.webhooks.generateTestHeaderString({
    payload: raw,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });
  return verifyStripeEvent(raw, header);
}
async function checkout(
  p: Awaited<ReturnType<typeof prepared>>,
  kind: "deposit" | "balance" = "deposit",
) {
  const result = await createStripeCheckout(
    { token: p.token, bookingId: p.bookingId, kind },
    mock,
  );
  const session = sessions.get("descomplica-checkout-" + result.attemptId)!;
  return { result, session };
}

test("configuração bloqueia chaves live e exige webhook; assinatura SDK rejeita adulteração", async () => {
  assert.equal(getStripeMode().ready, true);
  const previous = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_live_blocked";
  assert.equal(getStripeMode().ready, false);
  await assert.rejects(
    createStripeCheckout(
      { token: "a".repeat(43), bookingId: randomUUID(), kind: "deposit" },
      mock,
    ),
    { status: 503 },
  );
  for (const key of ["rk_test_fixture", "rkcs_test_fixture"]) {
    process.env.STRIPE_SECRET_KEY = key;
    assert.equal(getStripeMode().ready, true);
  }
  for (const key of ["rk_live_fixture", "rkcs_live_fixture", "notastripekey"]) {
    process.env.STRIPE_SECRET_KEY = key;
    assert.equal(getStripeMode().ready, false);
  }
  process.env.STRIPE_SECRET_KEY = previous;
  assert.throws(() => verifyStripeEvent("{}", "invalid"), { status: 400 });
  assert.throws(
    () => {
      const raw = "{}",
        sig = signing.webhooks.generateTestHeaderString({
          payload: raw,
          secret: "different",
        });
      verifyStripeEvent(raw, sig);
    },
    { status: 400 },
  );
  await assert.rejects(
    processStripeEvent({
      ...event({} as Stripe.Checkout.Session),
      livemode: true,
    }),
    { status: 400 },
  );
});
test("tentativa durável recupera timeout com mesmos parâmetros e chave; callback não confirma", async () => {
  const p = await prepared(20);
  const begin = calls.length;
  let firstParams: Stripe.Checkout.SessionCreateParams | undefined,
    firstKey = "";
  await assert.rejects(
    createStripeCheckout(
      { token: p.token, bookingId: p.bookingId, kind: "deposit" },
      {
        create: async (params, key) => {
          firstParams = params;
          firstKey = key;
          await mock.create(params, key);
          throw Error("timeout depois de criação remota");
        },
      },
    ),
    { status: 503 },
  );
  const result = await createStripeCheckout(
    { token: p.token, bookingId: p.bookingId, kind: "deposit" },
    mock,
  );
  assert.deepEqual(calls.at(-1)!.params, firstParams);
  assert.equal(calls.at(-1)!.key, firstKey);
  const again = await createStripeCheckout(
    { token: p.token, bookingId: p.bookingId, kind: "deposit" },
    mock,
  );
  assert.equal(again.url, result.url);
  assert.equal(calls.length - begin, 2);
  const ctx = await bookingContext(p.token);
  assert.equal(ctx.booking?.status, "awaiting_deposit");
  assert.ok(
    new Date(ctx.booking!.holdExpiresAt).getTime() - Date.now() > 30 * 60000,
  );
  assert.ok(ctx.booking!.paidCents === 0);
  await assert.rejects(cancelBooking(p.token, { bookingId: p.bookingId }), {
    status: 409,
  });
  await assert.rejects(
    recordSimulatedPayment({
      bookingId: p.bookingId,
      kind: "deposit",
      eventKey: randomUUID(),
    }),
    { status: 409 },
  );
});
test("webhook assinado confirma sinal e saldo, com deduplicação de evento e sessão", async () => {
  const p = await prepared(21),
    { session } = await checkout(p),
    paid = {
      ...session,
      status: "complete",
      payment_status: "paid",
    } as Stripe.Checkout.Session,
    e = signed(event(paid));
  await processStripeEvent(e);
  await processStripeEvent(e);
  await processStripeEvent(signed(event(paid)));
  assert.equal((await bookingContext(p.token)).booking?.status, "confirmed");
  const [count] =
    await db`SELECT count(*)::int AS n FROM booking_payments WHERE booking_id=${p.bookingId}`;
  assert.equal(count.n, 1);
  const balance = await checkout(p, "balance");
  await processStripeEvent(
    signed(
      event({
        ...balance.session,
        status: "complete",
        payment_status: "paid",
      } as Stripe.Checkout.Session),
    ),
  );
  const b = (await bookingContext(p.token)).booking!;
  assert.equal(b.status, "fully_paid");
  assert.equal(b.paidCents, b.totalCents);
  assert.equal(b.paymentReview, false);
});
test("valor, moeda, sessão, livemode e metadados incompatíveis são recusados", async () => {
  const p = await prepared(22),
    { session } = await checkout(p),
    paid = {
      ...session,
      status: "complete",
      payment_status: "paid",
    } as Stripe.Checkout.Session;
  for (const patch of [
    { amount_total: 1 },
    { currency: "usd" },
    { livemode: true },
    { id: "cs_test_other" },
    { metadata: { ...session.metadata, bookingId: randomUUID() } },
  ])
    await assert.rejects(
      processStripeEvent(
        signed(event({ ...paid, ...patch } as Stripe.Checkout.Session)),
      ),
      { status: 400 },
    );
  const b = (await bookingContext(p.token)).booking!;
  assert.equal(b.status, "awaiting_deposit");
  assert.equal(b.paidCents, 0);
  await assert.rejects(
    processStripeEvent(
      signed(
        event({
          ...paid,
          metadata: { attemptId: randomUUID() },
        } as Stripe.Checkout.Session),
      ),
    ),
    { status: 400 },
  );
});
test("recebimento tardio vira conciliação sem confirmar vaga que outro cliente ocupou", async () => {
  const p = await prepared(23),
    { session } = await checkout(p);
  await db`UPDATE bookings SET hold_expires_at=now()-interval '1 second' WHERE id=${p.bookingId}`;
  const q = await prepared(23);
  assert.equal(q.slot.startAt, p.slot.startAt);
  const e = signed(
    event({
      ...session,
      status: "complete",
      payment_status: "paid",
    } as Stripe.Checkout.Session),
  );
  const result = await processStripeEvent(e);
  assert.equal(result.review, true);
  await processStripeEvent(e);
  const old = (await bookingContext(p.token)).booking!;
  assert.equal(old.status, "expired");
  assert.equal(old.paymentReview, true);
  assert.equal(old.paidCents, 0);
  await assert.rejects(
    holdBooking(p.token, {
      date: p.date,
      locationId: "jardim-demo",
      startAt: p.slot.startAt,
    }),
    { status: 409 },
  );

  assert.equal(
    (await bookingContext(q.token)).booking?.status,
    "awaiting_deposit",
  );
  const [receipt] =
    await db`SELECT outcome,amount_cents FROM stripe_receipts WHERE booking_id=${p.bookingId}`;
  assert.equal(receipt.outcome, "review");
  assert.equal(receipt.amount_cents, old.depositCents);
});
test("cancelar sem pagamento libera capacidade; Stripe ativo exige expiração do provedor", async () => {
  const p = await prepared(24);
  assert.equal(
    (await cancelBooking(p.token, { bookingId: p.bookingId })).booking.status,
    "cancelled",
  );
  await assert.rejects(
    acceptBooking(p.token, { bookingId: p.bookingId, termsAccepted: true }),
    { status: 409 },
  );
  const q = await prepared(24);
  assert.equal(q.slot.startAt, p.slot.startAt);
  const { session } = await checkout(q);
  await assert.rejects(cancelBooking(q.token, { bookingId: q.bookingId }), {
    status: 409,
  });
  await processStripeEvent(
    signed(
      event(
        { ...session, status: "expired" } as Stripe.Checkout.Session,
        "checkout.session.expired",
      ),
    ),
  );
  assert.equal(
    (await cancelBooking(q.token, { bookingId: q.bookingId })).booking.status,
    "cancelled",
  );
});

test("Checkout expirado pelo Stripe permite nova tentativa da parcela; chamada concorrente continua idempotente", async () => {
  const p = await prepared(25),
    deposit = await checkout(p);
  await processStripeEvent(
    signed(
      event({
        ...deposit.session,
        status: "complete",
        payment_status: "paid",
      } as Stripe.Checkout.Session),
    ),
  );
  const old = await checkout(p, "balance");
  await processStripeEvent(
    signed(
      event(
        { ...old.session, status: "expired" } as Stripe.Checkout.Session,
        "checkout.session.expired",
      ),
    ),
  );
  const [a, b] = await Promise.all([
    createStripeCheckout(
      { token: p.token, bookingId: p.bookingId, kind: "balance" },
      mock,
    ),
    createStripeCheckout(
      { token: p.token, bookingId: p.bookingId, kind: "balance" },
      mock,
    ),
  ]);
  assert.notEqual(a.attemptId, old.result.attemptId);
  assert.equal(a.attemptId, b.attemptId);
  assert.equal(a.url, b.url);
  const rows =
    await db`SELECT state FROM stripe_checkout_attempts WHERE booking_id=${p.bookingId} AND kind='balance'`;
  assert.equal(rows.length, 2);
  assert.equal(
    rows.filter((r) => r.state === "open" || r.state === "pending").length,
    1,
  );
  const renewed = sessions.get("descomplica-checkout-" + a.attemptId)!;
  await processStripeEvent(
    signed(
      event({
        ...renewed,
        status: "complete",
        payment_status: "paid",
      } as Stripe.Checkout.Session),
    ),
  );
  assert.equal((await bookingContext(p.token)).booking?.status, "fully_paid");
});
test("tempo local vencido sem expiração confirmada não cria segunda cobrança", async () => {
  const p = await prepared(26),
    deposit = await checkout(p);
  await processStripeEvent(
    signed(
      event({
        ...deposit.session,
        status: "complete",
        payment_status: "paid",
      } as Stripe.Checkout.Session),
    ),
  );
  const balance = await checkout(p, "balance");
  await db`UPDATE stripe_checkout_attempts SET expires_at=now()-interval '1 second' WHERE id=${balance.result.attemptId}`;
  await assert.rejects(
    createStripeCheckout(
      { token: p.token, bookingId: p.bookingId, kind: "balance" },
      mock,
    ),
    { status: 409 },
  );
  const [n] =
    await db`SELECT count(*)::int AS n FROM stripe_checkout_attempts WHERE booking_id=${p.bookingId} AND kind='balance'`;
  assert.equal(n.n, 1);
});
test("confirmação estende acesso do cliente até evento mais sete dias sem reativar links revogados", async () => {
  const p = await prepared(50),
    deposit = await checkout(p);
  const [booking] =
    await db`SELECT proposal_id,proposal_version,end_at FROM bookings WHERE id=${p.bookingId}`;
  const tokenHash = "revoked-test-" + randomUUID();
  await db`INSERT INTO proposal_links(token_hash,proposal_id,version,expires_at,revoked_at) VALUES(${tokenHash},${booking.proposal_id},${booking.proposal_version},now()+interval '1 day',now())`;
  await processStripeEvent(
    signed(
      event({
        ...deposit.session,
        status: "complete",
        payment_status: "paid",
      } as Stripe.Checkout.Session),
    ),
  );
  const links =
    await db`SELECT revoked_at,expires_at FROM proposal_links WHERE proposal_id=${booking.proposal_id}`;
  const active = links.find((l) => !l.revoked_at)!;
  assert.ok(
    new Date(active.expires_at).getTime() >=
      new Date(booking.end_at).getTime() + 7 * 86400000,
  );
  const revoked = links.find((l) => l.revoked_at)!;
  assert.ok(
    new Date(revoked.expires_at).getTime() < new Date(booking.end_at).getTime(),
  );
  assert.equal((await bookingContext(p.token)).booking?.status, "confirmed");
});
