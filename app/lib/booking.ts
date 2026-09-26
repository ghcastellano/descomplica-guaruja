import { randomUUID } from "node:crypto";
import { z } from "zod";
import type postgres from "postgres";
import { db } from "./db";
import { hash } from "./crypto";
import { DomainError, protocol, money } from "./domain";

type Tx = postgres.TransactionSql;
type Row = Record<string, any>;
const minute = 60000,
  hour = 60 * minute,
  day = 24 * hour;
const clock = () => Date.now();
export const bookingLocations = [
  {
    id: "jardim-demo",
    name: "Jardim de demonstração",
    description: "Espaço fictício ao ar livre, somente para testar o fluxo.",
  },
  {
    id: "coberto-demo",
    name: "Espaço coberto de demonstração",
    description: "Alternativa fictícia coberta, somente para testar o fluxo.",
  },
] as const;
export const bookingConditions = {
  testOnly: true,
  termsVersion: "demo-v1",
  holdMinutes: 15,
  depositPercent: 50,
  balanceHoursBefore: 72,
  leadHours: 96,
  horizonDays: 60,
  setupMinutes: 60,
  teardownMinutes: 45,
  timezone: "America/Sao_Paulo",
  text: "SIMULAÇÃO: sinal de 50% para confirmar; saldo até 72 horas antes. Local e horários fictícios, sem cobrança real.",
} as const;
export type BookingStatus =
  | "held"
  | "awaiting_deposit"
  | "confirmed"
  | "fully_paid"
  | "expired"
  | "cancelled";
export type PublicBooking = {
  id: string;
  status: BookingStatus;
  proposalVersion: number;
  locationId: string;
  locationName: string;
  startAt: string;
  endAt: string;
  holdExpiresAt: string;
  totalCents: number;
  depositCents: number;
  balanceCents: number;
  paidCents: number;
  balanceDueAt: string;
  acceptedAt: string | null;
  termsVersion: string | null;
  paymentReview: boolean;
};
export type BookingContext = {
  locations: typeof bookingLocations;
  booking: PublicBooking | null;
  conditions: typeof bookingConditions;
  minDate: string;
  maxDate: string;
  durationMinutes: number | null;
};
export type Slot = { startAt: string; endAt: string; label: string };
const locationSchema = z.enum(["jardim-demo", "coberto-demo"]);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const selectionSchema = z
  .object({ date: dateSchema, locationId: locationSchema })
  .strict();
const holdSchema = selectionSchema
  .extend({ startAt: z.iso.datetime() })
  .strict();
const acceptSchema = z
  .object({ bookingId: z.uuid(), termsAccepted: z.literal(true) })
  .strict();
const paymentSchema = z
  .object({
    bookingId: z.uuid(),
    kind: z.enum(["deposit", "balance"]),
    eventKey: z.uuid(),
  })
  .strict();
const iso = (value: Date | string) => new Date(value).toISOString();
const localDate = (value: number) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
function publicBooking(b: Row): PublicBooking {
  const stale =
    ["held", "awaiting_deposit"].includes(b.status) &&
    new Date(b.hold_expires_at).getTime() <= clock();
  return {
    id: b.id,
    status: stale ? "expired" : b.status,
    proposalVersion: b.proposal_version,
    locationId: b.location_id,
    locationName: bookingLocations.find((x) => x.id === b.location_id)!.name,
    startAt: iso(b.start_at),
    endAt: iso(b.end_at),
    holdExpiresAt: iso(b.hold_expires_at),
    totalCents: b.total_cents,
    depositCents: b.deposit_cents,
    balanceCents: b.balance_cents,
    paidCents: b.paid_cents,
    balanceDueAt: iso(b.balance_due_at),
    acceptedAt: b.accepted_at ? iso(b.accepted_at) : null,
    termsVersion: b.terms_version,
    paymentReview: Boolean(b.payment_review),
  };
}
function duration(p: Row): number | null {
  const explicit = p.snapshot.durationMinutes;
  if (explicit === null) return null;
  if (explicit !== undefined)
    return Number.isInteger(explicit) && explicit >= 30 && explicit <= 360
      ? explicit
      : null;
  const key = String(p.briefing.packageId);
  if (key === "pedido_lux") return null;
  return key.endsWith("_ess")
    ? 90
    : key.endsWith("_ass")
      ? 120
      : key.endsWith("_lux")
        ? 150
        : null;
}
async function proposal(
  token: string,
  tx: Tx | typeof db = db,
  lock = false,
): Promise<Row> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new DomainError(404, "Proposta indisponível.");
  // Every mutation locks the proposal first, matching proposal editing lock order.
  const rows = lock
    ? await tx`SELECT p.id,p.version,p.status,r.briefing,v.snapshot,r.number FROM proposal_links l JOIN proposals p ON p.id=l.proposal_id AND p.version=l.version JOIN requests r ON r.id=p.id JOIN proposal_revisions v ON v.proposal_id=p.id AND v.version=p.version WHERE l.token_hash=${hash(token)} AND l.revoked_at IS NULL AND l.expires_at>now() AND p.status='released' FOR UPDATE OF p`
    : await tx`SELECT p.id,p.version,p.status,r.briefing,v.snapshot,r.number FROM proposal_links l JOIN proposals p ON p.id=l.proposal_id AND p.version=l.version JOIN requests r ON r.id=p.id JOIN proposal_revisions v ON v.proposal_id=p.id AND v.version=p.version WHERE l.token_hash=${hash(token)} AND l.revoked_at IS NULL AND l.expires_at>now() AND p.status='released'`;
  if (!rows.length)
    throw new DomainError(
      404,
      "O link expirou ou a proposta mudou. Solicite a versão atual.",
    );
  return rows[0];
}
async function assertNoPaymentReview(tx: Tx, proposalId: string) {
  const flagged =
    await tx`SELECT id FROM bookings WHERE proposal_id=${proposalId} AND payment_review=true LIMIT 1`;
  if (flagged.length)
    throw new DomainError(
      409,
      "Há um recebimento pendente de conciliação nesta proposta. A equipe precisa conferir antes de seguir.",
    );
}
async function extendBookingAccess(tx: Tx, b: Row) {
  const until = new Date(new Date(b.end_at).getTime() + 7 * day);
  const extended =
    await tx`UPDATE proposal_links SET expires_at=GREATEST(expires_at,${until}) WHERE proposal_id=${b.proposal_id} AND version=${b.proposal_version} AND revoked_at IS NULL AND expires_at<${until} RETURNING token_hash`;
  if (extended.length)
    await audit(tx, b, "booking_access_extended", "Sistema de teste", {
      accessUntil: until.toISOString(),
    });
}
async function audit(
  tx: Tx,
  b: Row,
  kind: string,
  actor: string,
  details: Record<string, unknown> = {},
) {
  await tx`INSERT INTO audit_events(proposal_id,kind,actor,details) VALUES(${b.proposal_id},${kind},${actor},${tx.json({ bookingId: b.id, version: b.proposal_version, ...details })})`;
}
async function notify(tx: Tx, b: Row, kind: string, text: string) {
  for (const audience of ["client", "sophia"])
    await tx`INSERT INTO booking_notifications(id,booking_id,kind,audience,message) VALUES(${randomUUID()},${b.id},${kind},${audience},${"[SIMULAÇÃO — NÃO ENVIADO] " + text}) ON CONFLICT(booking_id,kind,audience) DO NOTHING`;
}
async function expire(tx: Tx) {
  // One demo crew: serialize allocations, expiration, acceptance and payment.
  await tx`SELECT pg_advisory_xact_lock(846522)`;
  const expired =
    await tx`UPDATE bookings SET status='expired',updated_at=now() WHERE status IN ('held','awaiting_deposit') AND hold_expires_at<=now() RETURNING *`;
  for (const b of expired) {
    await audit(tx, b, "booking_expired", "Sistema de teste");
    await notify(
      tx,
      b,
      "hold_expired",
      "O prazo da pré-reserva expirou. Escolha outro horário disponível antes de continuar.",
    );
  }
}
function slotsFor(p: Row, date: string): Slot[] {
  const length = duration(p);
  if (length === null)
    throw new DomainError(
      409,
      "Sophia precisa definir a duração desta experiência antes de agendar.",
    );
  const noon = new Date(`${date}T12:00:00-03:00`);
  if (!Number.isFinite(noon.getTime()) || localDate(noon.getTime()) !== date)
    throw new DomainError(422, "Data inválida.");
  const now = clock();
  if (date < localDate(now + 96 * hour) || date > localDate(now + 60 * day))
    throw new DomainError(
      422,
      "Escolha uma data dentro da janela de teste: 96 horas a 60 dias.",
    );
  const hours: Record<string, number[]> = {
    manha: [9],
    tarde: [14],
    "por-do-sol": [17],
    noite: [],
    flexivel: [9, 14, 17],
  };
  return (hours[p.briefing.period] || [])
    .map((h) => {
      const start = new Date(
        `${date}T${String(h).padStart(2, "0")}:00:00-03:00`,
      ).getTime();
      return {
        startAt: new Date(start).toISOString(),
        endAt: new Date(start + length * minute).toISOString(),
        label: `${String(h).padStart(2, "0")}:00`,
      };
    })
    .filter(
      (s) =>
        new Date(s.startAt).getTime() >= now + 96 * hour &&
        new Date(s.startAt).getTime() <= now + 60 * day,
    );
}
export async function bookingContext(token: string): Promise<BookingContext> {
  const p = await proposal(token);
  const [b] =
    await db`SELECT * FROM bookings WHERE proposal_id=${p.id} AND proposal_version=${p.version} ORDER BY created_at DESC LIMIT 1`;
  const flagged =
    await db`SELECT id FROM bookings WHERE proposal_id=${p.id} AND payment_review=true LIMIT 1`;
  return {
    locations: bookingLocations,
    booking: b
      ? { ...publicBooking(b), paymentReview: flagged.length > 0 }
      : null,
    conditions: bookingConditions,
    minDate: localDate(clock() + 96 * hour),
    maxDate: localDate(clock() + 60 * day),
    durationMinutes: duration(p),
  };
}
export async function getAvailability(token: string, input: unknown) {
  const selected = selectionSchema.parse(input);
  return db.begin(async (tx) => {
    const p = await proposal(token, tx, true);
    await expire(tx);
    const candidates = slotsFor(p, selected.date);
    const available: Slot[] = [];
    for (const slot of candidates) {
      const occupiedStart = new Date(
          new Date(slot.startAt).getTime() - 60 * minute,
        ),
        occupiedEnd = new Date(new Date(slot.endAt).getTime() + 45 * minute);
      const conflicts =
        await tx`SELECT id FROM bookings WHERE resource_id='equipe-demo' AND status IN ('held','awaiting_deposit','confirmed','fully_paid') AND proposal_id<>${p.id} AND occupied_range && tstzrange(${occupiedStart},${occupiedEnd},'[)') LIMIT 1`;
      if (!conflicts.length) available.push(slot);
    }
    return {
      slots: available,
      durationMinutes: duration(p),
      conditions: bookingConditions,
    };
  });
}
export async function holdBooking(
  token: string,
  input: unknown,
): Promise<{ booking: PublicBooking }> {
  const selected = holdSchema.parse(input);
  return db.begin(async (tx) => {
    const p = await proposal(token, tx, true);
    await expire(tx);
    await assertNoPaymentReview(tx, p.id);
    const slot = slotsFor(p, selected.date).find(
      (s) => s.startAt === selected.startAt,
    );
    if (!slot)
      throw new DomainError(
        422,
        "Este horário não faz parte das opções disponíveis para a proposta.",
      );
    const [existing] =
      await tx`SELECT * FROM bookings WHERE proposal_id=${p.id} AND status IN ('held','awaiting_deposit','confirmed','fully_paid') FOR UPDATE`;
    if (existing) {
      if (
        existing.location_id === selected.locationId &&
        iso(existing.start_at) === slot.startAt &&
        existing.proposal_version === p.version
      )
        return { booking: publicBooking(existing) };
      throw new DomainError(
        409,
        "Já existe uma pré-reserva ou reserva ativa para esta proposta. Aguarde a expiração ou fale com a equipe.",
      );
    }
    const occupiedStart = new Date(
        new Date(slot.startAt).getTime() - 60 * minute,
      ),
      occupiedEnd = new Date(new Date(slot.endAt).getTime() + 45 * minute);
    const conflicts =
      await tx`SELECT id FROM bookings WHERE resource_id='equipe-demo' AND status IN ('held','awaiting_deposit','confirmed','fully_paid') AND occupied_range && tstzrange(${occupiedStart},${occupiedEnd},'[)') LIMIT 1`;
    if (conflicts.length)
      throw new DomainError(
        409,
        "Este horário acabou de ser ocupado. Escolha outra opção.",
      );
    const total = p.snapshot.amountCents,
      deposit = Math.ceil(total / 2),
      balance = total - deposit;
    const [b] =
      await tx`INSERT INTO bookings(id,proposal_id,proposal_version,status,location_id,start_at,end_at,occupied_range,hold_expires_at,total_cents,deposit_cents,balance_cents,balance_due_at) VALUES(${randomUUID()},${p.id},${p.version},'held',${selected.locationId},${new Date(slot.startAt)},${new Date(slot.endAt)},tstzrange(${occupiedStart},${occupiedEnd},'[)'),now()+interval '15 minutes',${total},${deposit},${balance},${new Date(new Date(slot.startAt).getTime() - 72 * hour)}) RETURNING *`;
    await audit(tx, b, "booking_held", "Cliente · link de teste", {
      locationId: selected.locationId,
      startAt: slot.startAt,
      endAt: slot.endAt,
    });
    await notify(
      tx,
      b,
      "hold_created",
      "Horário separado por 15 minutos. O aceite das condições e a simulação do sinal pela equipe ainda são necessários para confirmar.",
    );
    return { booking: publicBooking(b) };
  });
}
export async function acceptBooking(
  token: string,
  input: unknown,
): Promise<{ booking: PublicBooking }> {
  const selected = acceptSchema.parse(input);
  return db.begin(async (tx) => {
    const p = await proposal(token, tx, true);
    await expire(tx);
    await assertNoPaymentReview(tx, p.id);
    const [b] =
      await tx`SELECT * FROM bookings WHERE id=${selected.bookingId} AND proposal_id=${p.id} AND proposal_version=${p.version} FOR UPDATE`;
    if (!b)
      throw new DomainError(
        404,
        "Pré-reserva não encontrada para esta proposta.",
      );
    if (b.status === "expired" || b.status === "cancelled")
      throw new DomainError(
        409,
        "A pré-reserva expirou. Escolha outro horário.",
      );
    if (["awaiting_deposit", "confirmed", "fully_paid"].includes(b.status))
      return { booking: publicBooking(b) };
    const agreement = {
      proposalVersion: p.version,
      amountCents: b.total_cents,
      items: p.snapshot.items,
      clientNote: p.snapshot.clientNote,
      durationMinutes: duration(p),
      guests: p.briefing.guests,
      locationId: b.location_id,
      startAt: iso(b.start_at),
      endAt: iso(b.end_at),
      depositCents: b.deposit_cents,
      balanceCents: b.balance_cents,
      balanceDueAt: iso(b.balance_due_at),
      conditions: bookingConditions,
    };
    const [updated] =
      await tx`UPDATE bookings SET status='awaiting_deposit',accepted_at=now(),terms_version=${bookingConditions.termsVersion},accepted_snapshot=${tx.json(agreement)},updated_at=now() WHERE id=${b.id} RETURNING *`;
    await audit(tx, updated, "booking_accepted", "Cliente · link de teste", {
      termsVersion: bookingConditions.termsVersion,
      totalCents: b.total_cents,
    });
    await notify(
      tx,
      updated,
      "accepted",
      `Condições aceitas. Sinal simulado de ${money(b.deposit_cents)} pendente; somente a equipe pode registrar o teste. A pré-reserva mantém o prazo original de 15 minutos.`,
    );
    return { booking: publicBooking(updated) };
  });
}
export async function recordSimulatedPayment(
  input: unknown,
): Promise<{ booking: PublicBooking; duplicate: boolean }> {
  const selected = paymentSchema.parse(input);
  return db.begin(async (tx) => {
    const [ref] =
      await tx`SELECT proposal_id FROM bookings WHERE id=${selected.bookingId}`;
    if (!ref) throw new DomainError(404, "Reserva não encontrada.");
    const [p] =
      await tx`SELECT id,version,status FROM proposals WHERE id=${ref.proposal_id} FOR UPDATE`;
    await expire(tx);
    await assertNoPaymentReview(tx, p.id);
    const [b] =
      await tx`SELECT * FROM bookings WHERE id=${selected.bookingId} FOR UPDATE`;
    if (p.version !== b.proposal_version || p.status !== "released")
      throw new DomainError(
        409,
        "A proposta mudou. Não foi registrado nenhum pagamento.",
      );
    const [previous] =
      await tx`SELECT * FROM booking_payments WHERE event_key=${selected.eventKey}`;
    if (previous) {
      if (previous.booking_id !== b.id || previous.kind !== selected.kind)
        throw new DomainError(
          409,
          "Esta chave de pagamento já pertence a outro evento.",
        );
      return { booking: publicBooking(b), duplicate: true };
    }
    const checkout =
      await tx`SELECT id FROM stripe_checkout_attempts WHERE booking_id=${b.id} AND state IN ('pending','open','completed','review') LIMIT 1`;
    if (checkout.length)
      throw new DomainError(
        409,
        "Existe um Checkout Stripe para esta reserva. Aguarde a confirmação do provedor; não use o simulador manual.",
      );
    const [sameKind] =
      await tx`SELECT id FROM booking_payments WHERE booking_id=${b.id} AND kind=${selected.kind}`;
    if (sameKind) return { booking: publicBooking(b), duplicate: true };
    if (selected.kind === "deposit" && b.status !== "awaiting_deposit")
      throw new DomainError(
        409,
        b.status === "expired"
          ? "A pré-reserva expirou. Nenhum pagamento foi registrado; escolha um novo horário."
          : "É necessário aceitar as condições antes de simular o sinal.",
      );
    if (selected.kind === "balance" && b.status !== "confirmed")
      throw new DomainError(
        409,
        "O sinal deve estar confirmado antes de simular o saldo.",
      );
    const amount =
      selected.kind === "deposit" ? b.deposit_cents : b.balance_cents;
    await tx`INSERT INTO booking_payments(id,booking_id,event_key,kind,amount_cents) VALUES(${randomUUID()},${b.id},${selected.eventKey},${selected.kind},${amount})`;
    const [updated] =
      await tx`UPDATE bookings SET status=${selected.kind === "deposit" ? "confirmed" : "fully_paid"},paid_cents=paid_cents+${amount},updated_at=now() WHERE id=${b.id} RETURNING *`;
    if (selected.kind === "deposit") await extendBookingAccess(tx, updated);
    await audit(
      tx,
      updated,
      selected.kind === "deposit" ? "booking_confirmed" : "booking_fully_paid",
      "Sophia · pagamento simulado",
      { kind: selected.kind, amountCents: amount, provider: "simulated" },
    );
    await notify(
      tx,
      updated,
      selected.kind === "deposit" ? "deposit_confirmed" : "balance_paid",
      selected.kind === "deposit"
        ? `Reserva confirmada em teste após sinal simulado de ${money(amount)}. Saldo de ${money(b.balance_cents)} até ${new Date(b.balance_due_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`
        : `Saldo simulado de ${money(amount)} registrado. Experiência integralmente paga em teste.`,
    );
    return { booking: publicBooking(updated), duplicate: false };
  });
}
export async function listBookingsForStaff() {
  const bookings =
    await db`SELECT b.*,r.number,r.briefing->>'name' AS name FROM bookings b JOIN requests r ON r.id=b.proposal_id ORDER BY b.start_at,b.created_at DESC`;
  const notifications =
    await db`SELECT booking_id,audience,kind,message,created_at FROM booking_notifications ORDER BY created_at DESC`;
  return bookings.map((b) => ({
    ...publicBooking(b),
    proposalId: String(b.proposal_id),
    protocol: protocol(b.number),
    name: String(b.name),
    notifications: notifications
      .filter((n) => n.booking_id === b.id)
      .map((n) => ({
        audience: String(n.audience),
        kind: String(n.kind),
        text: String(n.message),
        createdAt: iso(n.created_at),
      })),
  }));
}

export async function cancelBooking(
  token: string,
  input: unknown,
): Promise<{ booking: PublicBooking }> {
  const { bookingId } = z.object({ bookingId: z.uuid() }).strict().parse(input);
  return db.begin(async (tx) => {
    const p = await proposal(token, tx, true);
    await expire(tx);
    const [b] =
      await tx`SELECT * FROM bookings WHERE id=${bookingId} AND proposal_id=${p.id} AND proposal_version=${p.version} FOR UPDATE`;
    if (!b) throw new DomainError(404, "Pré-reserva não encontrada.");
    const attempt =
      await tx`SELECT id FROM stripe_checkout_attempts WHERE booking_id=${b.id} AND state IN ('pending','open','completed','review') LIMIT 1`;
    if (attempt.length)
      throw new DomainError(
        409,
        "Há uma tentativa Stripe em processamento. Aguarde a confirmação de expiração do provedor antes de escolher outro horário.",
      );
    if (b.status === "cancelled" || b.status === "expired")
      return { booking: publicBooking(b) };
    if (!["held", "awaiting_deposit"].includes(b.status) || b.paid_cents > 0)
      throw new DomainError(
        409,
        "Uma reserva paga precisa ser tratada pela equipe.",
      );
    const [cancelled] =
      await tx`UPDATE bookings SET status='cancelled',updated_at=now() WHERE id=${b.id} RETURNING *`;
    await audit(tx, cancelled, "booking_cancelled", "Cliente · link de teste");
    await notify(
      tx,
      cancelled,
      "booking_cancelled",
      "Pré-reserva cancelada. Nenhum pagamento foi realizado; outro horário pode ser escolhido.",
    );
    return { booking: publicBooking(cancelled) };
  });
}
export const bookingInternals = {
  assertNoPaymentReview,
  extendBookingAccess,
  proposal,
  expire,
  audit,
  notify,
  publicBooking,
};
