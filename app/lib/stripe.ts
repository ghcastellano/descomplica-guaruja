import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { config } from "./config";
import { encrypt, decrypt } from "./crypto";
import { DomainError, money } from "./domain";
import { bookingInternals as core } from "./booking";

export function getStripeMode() {
  const key = process.env.STRIPE_SECRET_KEY || "",
    secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const ready = key.startsWith("sk_test_") && secret.startsWith("whsec_");
  return {
    ready,
    mode: "test" as const,
    reason: ready
      ? "Stripe em modo de teste. Nenhum pagamento real."
      : key.startsWith("sk_live_")
        ? "Chaves de produção são bloqueadas neste ambiente."
        : "Configure STRIPE_SECRET_KEY de teste e STRIPE_WEBHOOK_SECRET para usar o Checkout.",
  };
}
function sdk() {
  if (!getStripeMode().ready)
    throw new DomainError(503, getStripeMode().reason);
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    maxNetworkRetries: 2,
    timeout: 15000,
  });
}
export type StripeTransport = {
  create: (
    params: Stripe.Checkout.SessionCreateParams,
    idempotencyKey: string,
  ) => Promise<Stripe.Checkout.Session>;
};
const officialTransport = (): StripeTransport => {
  const client = sdk();
  return {
    create: (params, key) =>
      client.checkout.sessions.create(params, { idempotencyKey: key }),
  };
};
const checkoutSchema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    bookingId: z.uuid(),
    kind: z.enum(["deposit", "balance"]),
  })
  .strict();
function validateSession(
  session: Stripe.Checkout.Session,
  attempt: Record<string, any>,
) {
  if (
    session.livemode !== false ||
    session.mode !== "payment" ||
    session.currency !== "brl" ||
    session.amount_total !== attempt.amount_cents ||
    session.metadata?.attemptId !== attempt.id ||
    session.metadata?.bookingId !== attempt.booking_id ||
    session.metadata?.kind !== attempt.kind ||
    session.client_reference_id !== attempt.id ||
    !session.id.startsWith("cs_test_") ||
    (attempt.stripe_session_id && session.id !== attempt.stripe_session_id)
  )
    throw new DomainError(
      400,
      "Evento Stripe incompatível com a tentativa registrada.",
    );
}
export async function createStripeCheckout(
  input: unknown,
  transport?: StripeTransport,
) {
  const selected = checkoutSchema.parse(input);
  if (!getStripeMode().ready)
    throw new DomainError(503, getStripeMode().reason);
  const attempt = await db.begin(async (tx) => {
    const p = await core.proposal(selected.token, tx, true);
    await core.expire(tx);
    await core.assertNoPaymentReview(tx, p.id);
    const [b] =
      await tx`SELECT * FROM bookings WHERE id=${selected.bookingId} AND proposal_id=${p.id} AND proposal_version=${p.version} FOR UPDATE`;
    if (!b) throw new DomainError(404, "Reserva não encontrada.");
    if (b.payment_review)
      throw new DomainError(409, "Há um pagamento em análise pela equipe.");
    if (selected.kind === "deposit" && b.status !== "awaiting_deposit")
      throw new DomainError(
        409,
        "Aceite as condições e mantenha a pré-reserva válida antes do sinal.",
      );
    if (selected.kind === "balance" && b.status !== "confirmed")
      throw new DomainError(
        409,
        "O sinal deve estar confirmado antes de pagar o saldo.",
      );
    const [old] =
      await tx`SELECT * FROM stripe_checkout_attempts WHERE booking_id=${b.id} AND kind=${selected.kind} AND state<>'expired' ORDER BY created_at DESC LIMIT 1`;
    if (old) {
      if (
        ["completed", "review"].includes(old.state) ||
        new Date(old.expires_at).getTime() <= Date.now()
      )
        throw new DomainError(
          409,
          "Esta tentativa já encerrou ou precisa de conferência pela equipe. Nenhuma nova cobrança foi criada.",
        );
      return old;
    }
    const [paid] =
      await tx`SELECT id FROM booking_payments WHERE booking_id=${b.id} AND kind=${selected.kind}`;
    if (paid) throw new DomainError(409, "Esta parcela já foi registrada.");
    const id = randomUUID(),
      expiresAt = Math.floor(Date.now() / 1000) + 31 * 60,
      amount = selected.kind === "deposit" ? b.deposit_cents : b.balance_cents;
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      currency: "brl",
      client_reference_id: id,
      metadata: { attemptId: id, bookingId: b.id, kind: selected.kind },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: amount,
            product_data: {
              name: `Descomplica · ${selected.kind === "deposit" ? "sinal 50%" : "saldo"} · TESTE`,
            },
          },
        },
      ],
      success_url: `${config().origin}/p/${selected.token}?checkout=returned`,
      cancel_url: `${config().origin}/p/${selected.token}?checkout=cancelled`,
      expires_at: expiresAt,
      locale: "pt-BR",
    };
    // Persist exact parameters before contacting Stripe, including the fixed expiry.
    const [created] =
      await tx`INSERT INTO stripe_checkout_attempts(id,booking_id,kind,amount_cents,request_ciphertext,expires_at) VALUES(${id},${b.id},${selected.kind},${amount},${encrypt(JSON.stringify(params))},${new Date(expiresAt * 1000)}) RETURNING *`;
    if (selected.kind === "deposit")
      await tx`UPDATE bookings SET hold_expires_at=${new Date(expiresAt * 1000)},updated_at=now() WHERE id=${b.id}`;
    await core.audit(
      tx,
      b,
      "stripe_checkout_started",
      "Cliente · Stripe teste",
      { attemptId: id, kind: selected.kind, amountCents: amount },
    );
    return created;
  });
  if (attempt.url_ciphertext)
    return {
      url: decrypt(attempt.url_ciphertext),
      attemptId: String(attempt.id),
      expiresAt: new Date(attempt.expires_at).toISOString(),
    };
  let session: Stripe.Checkout.Session;
  try {
    session = await (transport || officialTransport()).create(
      JSON.parse(decrypt(attempt.request_ciphertext)),
      `descomplica-checkout-${attempt.id}`,
    );
  } catch {
    throw new DomainError(
      503,
      "Não foi possível abrir o Stripe agora. Tente novamente: a mesma tentativa será recuperada sem criar outra cobrança.",
    );
  }
  validateSession(session, attempt);
  if (!session.url || !session.url.startsWith("https://checkout.stripe.com/"))
    throw new DomainError(
      502,
      "O Stripe não retornou um endereço de Checkout válido.",
    );
  const linked =
    await db`UPDATE stripe_checkout_attempts SET stripe_session_id=${session.id},url_ciphertext=${encrypt(session.url)},state=CASE WHEN state='pending' THEN 'open' ELSE state END,updated_at=now() WHERE id=${attempt.id} AND (stripe_session_id IS NULL OR stripe_session_id=${session.id}) RETURNING id`;
  if (!linked.length)
    throw new DomainError(
      409,
      "A tentativa Stripe precisa de conferência pela equipe.",
    );
  return {
    url: session.url,
    attemptId: String(attempt.id),
    expiresAt: new Date(attempt.expires_at).toISOString(),
  };
}
export function verifyStripeEvent(rawBody: string, signature: string) {
  if (!getStripeMode().ready)
    throw new DomainError(503, getStripeMode().reason);
  try {
    return sdk().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    throw new DomainError(400, "Assinatura Stripe inválida.");
  }
}
export async function processStripeEvent(event: Stripe.Event): Promise<{
  received: boolean;
  duplicate?: boolean;
  pending?: boolean;
  review?: boolean;
  ignored?: boolean;
}> {
  if (event.livemode !== false)
    throw new DomainError(400, "Eventos de produção são bloqueados.");
  if (
    ![
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.expired",
    ].includes(event.type)
  )
    return { received: true, ignored: true };
  const session = event.data.object as Stripe.Checkout.Session,
    attemptId = session.metadata?.attemptId;
  if (!z.uuid().safeParse(attemptId).success)
    throw new DomainError(400, "Tentativa Stripe desconhecida.");
  return db.begin(async (tx) => {
    const [ref] =
      await tx`SELECT a.booking_id,b.proposal_id FROM stripe_checkout_attempts a JOIN bookings b ON b.id=a.booking_id WHERE a.id=${attemptId!}`;
    if (!ref) throw new DomainError(400, "Tentativa Stripe desconhecida.");
    const [p] =
      await tx`SELECT * FROM proposals WHERE id=${ref.proposal_id} FOR UPDATE`;
    await core.expire(tx);
    const [b] =
      await tx`SELECT * FROM bookings WHERE id=${ref.booking_id} FOR UPDATE`;
    const [attempt] =
      await tx`SELECT * FROM stripe_checkout_attempts WHERE id=${attemptId!} FOR UPDATE`;
    validateSession(session, attempt);
    const [prior] =
      await tx`SELECT id FROM stripe_webhook_events WHERE id=${event.id}`;
    if (prior) return { received: true, duplicate: true };
    if (event.type === "checkout.session.expired") {
      if (session.status !== "expired" || session.payment_status === "paid")
        throw new DomainError(400, "Expiração Stripe incompatível.");
      await tx`INSERT INTO stripe_webhook_events(id,type,stripe_session_id,attempt_id) VALUES(${event.id},${event.type},${session.id},${attempt.id})`;
      await tx`UPDATE stripe_checkout_attempts SET state=CASE WHEN state IN ('pending','open') THEN 'expired' ELSE state END,stripe_session_id=${session.id},updated_at=now() WHERE id=${attempt.id}`;
      return { received: true };
    }
    if (session.payment_status !== "paid")
      return { received: true, pending: true };
    if (session.status !== "complete")
      throw new DomainError(400, "Pagamento Stripe sem sessão concluída.");
    const intent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!intent?.startsWith("pi_"))
      throw new DomainError(400, "Identificador de pagamento inválido.");
    await tx`INSERT INTO stripe_webhook_events(id,type,stripe_session_id,attempt_id) VALUES(${event.id},${event.type},${session.id},${attempt.id})`;
    const [receipt] =
      await tx`SELECT stripe_session_id FROM stripe_receipts WHERE stripe_session_id=${session.id}`;
    if (receipt) return { received: true, duplicate: true };
    const [other] =
      await tx`SELECT id FROM booking_payments WHERE booking_id=${b.id} AND kind=${attempt.kind}`;
    const flagged =
      await tx`SELECT id FROM bookings WHERE proposal_id=${b.proposal_id} AND payment_review=true LIMIT 1`;
    const valid =
      !other &&
      !b.payment_review &&
      !flagged.length &&
      p.version === b.proposal_version &&
      p.status === "released" &&
      (attempt.kind === "deposit"
        ? b.status === "awaiting_deposit" &&
          new Date(b.hold_expires_at).getTime() > Date.now()
        : b.status === "confirmed");
    const reason = valid
      ? null
      : "Pagamento recebido após expiração, mudança de proposta, parcela já registrada ou estado incompatível. Conferência e eventual estorno manual necessários.";
    await tx`INSERT INTO stripe_receipts(stripe_session_id,attempt_id,booking_id,payment_intent_id,amount_cents,currency,outcome,review_reason) VALUES(${session.id},${attempt.id},${b.id},${intent},${attempt.amount_cents},'brl',${valid ? "applied" : "review"},${reason})`;
    await tx`UPDATE stripe_checkout_attempts SET stripe_session_id=${session.id},state=${valid ? "completed" : "review"},updated_at=now() WHERE id=${attempt.id}`;
    if (!valid) {
      await tx`UPDATE bookings SET payment_review=true,updated_at=now() WHERE id=${b.id}`;
      await core.audit(
        tx,
        b,
        "stripe_payment_review",
        "Stripe · webhook teste",
        { attemptId: attempt.id, amountCents: attempt.amount_cents },
      );
      await core.notify(
        tx,
        b,
        `stripe_payment_review_${attempt.id}`,
        `Recebimento de teste de ${money(attempt.amount_cents)} precisa de conferência. A reserva não foi confirmada por este pagamento. A equipe verificará a situação.`,
      );
      return { received: true, review: true };
    }
    await tx`INSERT INTO booking_payments(id,booking_id,event_key,kind,amount_cents,provider,stripe_session_id,payment_intent_id) VALUES(${randomUUID()},${b.id},${randomUUID()},${attempt.kind},${attempt.amount_cents},'stripe_test',${session.id},${intent})`;
    const [updated] =
      await tx`UPDATE bookings SET status=${attempt.kind === "deposit" ? "confirmed" : "fully_paid"},paid_cents=paid_cents+${attempt.amount_cents},updated_at=now() WHERE id=${b.id} RETURNING *`;
    if (attempt.kind === "deposit") await core.extendBookingAccess(tx, updated);
    await core.audit(
      tx,
      updated,
      attempt.kind === "deposit" ? "booking_confirmed" : "booking_fully_paid",
      "Stripe · webhook teste",
      {
        kind: attempt.kind,
        amountCents: attempt.amount_cents,
        provider: "stripe_test",
      },
    );
    await core.notify(
      tx,
      updated,
      attempt.kind === "deposit" ? "deposit_confirmed" : "balance_paid",
      attempt.kind === "deposit"
        ? `Sinal de teste de ${money(attempt.amount_cents)} confirmado pelo Stripe. Reserva confirmada em teste; saldo ${money(b.balance_cents)} até ${new Date(b.balance_due_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`
        : "Saldo de teste confirmado pelo Stripe. Experiência integralmente paga em teste.",
    );
    return { received: true };
  });
}
