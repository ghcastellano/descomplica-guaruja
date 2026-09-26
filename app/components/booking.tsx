"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { BookingContext, PublicBooking, Slot } from "@/lib/booking";
const money = (c: number) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
import { bookingLabels } from "@/lib/booking-labels";
export function Booking({
  token,
  context,
  stripeReady,
}: {
  token: string;
  context: BookingContext;
  stripeReady: boolean;
}) {
  const router = useRouter();
  const [date, setDate] = useState(""),
    [location, setLocation] = useState(""),
    [slots, setSlots] = useState<Slot[]>([]),
    [chosen, setChosen] = useState(""),
    [searched, setSearched] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [accepted, setAccepted] = useState(false);
  const b = context.booking,
    active = b && !["expired", "cancelled"].includes(b.status);
  useEffect(() => {
    if (b?.status === "awaiting_deposit" || b?.status === "confirmed") {
      const id = setInterval(() => router.refresh(), 10000);
      return () => clearInterval(id);
    }
  }, [b?.status, router]);
  async function request(body: Record<string, unknown>, url = "/api/booking") {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Não foi possível continuar.");
    return data;
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    setSlots([]);
    setChosen("");
    setSearched(false);
  }
  async function checkout(kind: "deposit" | "balance") {
    await run(async () => {
      const result = await request(
        { bookingId: b!.id, kind },
        "/api/stripe/checkout",
      );
      window.location.assign(result.url);
    });
  }
  return (
    <section
      className="paper card booking-panel"
      aria-labelledby="booking-title"
    >
      <span className="eyebrow">O PRÓXIMO PASSO</span>
      <h2 id="booking-title">Um lugar e uma hora para viver isso.</h2>
      <p className="muted">
        Demonstração com locais fictícios e pagamentos de teste. Horários de
        Brasília.
      </p>
      <ol className="booking-steps" aria-label="Etapas da reserva">
        <li>Escolher horário</li>
        <li>Aceitar proposta</li>
        <li>Pagar sinal</li>
      </ol>
      {b?.paymentReview ? (
        <div className="notice" role="status">
          Recebemos um pagamento que precisa ser conferido pela equipe. O
          horário não está confirmado automaticamente. Não faça outro pagamento;
          aguarde o contato da Sophia.
        </div>
      ) : !active ? (
        <>
          {b && (
            <p className="notice">
              {bookingLabels[b.status]}. Escolha uma nova disponibilidade para
              continuar.
            </p>
          )}
          {!context.durationMinutes ? (
            <p className="notice">
              A Sophia está ajustando a duração da sua experiência. Assim que
              estiver definida, você poderá escolher um horário aqui.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  const data = await request({
                    action: "availability",
                    date,
                    locationId: location,
                  });
                  setSlots(data.slots);
                  setSearched(true);
                  setChosen("");
                });
              }}
            >
              <div className="form-grid">
                <label>
                  Local de demonstração
                  <select
                    required
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      reset();
                    }}
                  >
                    <option value="">Escolha o espaço</option>
                    {context.locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Data desejada
                  <input
                    type="date"
                    required
                    min={context.minDate}
                    max={context.maxDate}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      reset();
                    }}
                  />
                </label>
              </div>
              <button className="btn btn-secondary" disabled={busy}>
                Consultar horários
              </button>
              <small className="muted">
                Duração de {context.durationMinutes} minutos. A agenda também
                protege o tempo de preparação e desmontagem.
              </small>
            </form>
          )}
          {searched && (
            <div className="availability" aria-live="polite">
              {slots.length ? (
                <>
                  <fieldset>
                    <legend>
                      Horários disponíveis para o período solicitado
                    </legend>
                    <div className="slot-grid">
                      {slots.map((s) => (
                        <label
                          className={
                            "slot " + (chosen === s.startAt ? "selected" : "")
                          }
                          key={s.startAt}
                        >
                          <input
                            type="radio"
                            name="slot"
                            value={s.startAt}
                            checked={chosen === s.startAt}
                            onChange={() => setChosen(s.startAt)}
                          />
                          <span>{s.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <button
                    className="btn btn-primary"
                    disabled={!chosen || busy}
                    onClick={() =>
                      run(async () => {
                        await request({
                          action: "hold",
                          date,
                          locationId: location,
                          startAt: chosen,
                        });
                        setAccepted(false);
                        router.refresh();
                      })
                    }
                  >
                    Separar este horário →
                  </button>
                </>
              ) : (
                <p className="notice">
                  Não há horários livres nesse dia para o período da proposta.
                  Tente outra data ou peça à Sophia para revisar o período.
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <span className="badge released">{bookingLabels[b.status]}</span>
          <BookingSummary booking={b} />
          {["held", "awaiting_deposit"].includes(b.status) && (
            <p className="muted">
              Horário separado até{" "}
              {new Date(b.holdExpiresAt).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}
              . A reserva se confirma após o sinal. Se o prazo terminar, a
              disponibilidade será verificada novamente.
            </p>
          )}
          {b.status === "held" && (
            <>
              <p className="notice">
                {context.conditions.text} O saldo vence{" "}
                {context.conditions.balanceHoursBefore} horas antes da
                experiência.
              </p>
              <label className="check">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>
                  Li os itens, o valor total, a data, o local e as condições
                  desta proposta de teste. Quero continuar.
                </span>
              </label>
              <button
                className="btn btn-primary"
                disabled={!accepted || busy}
                onClick={() =>
                  run(async () => {
                    await request({
                      action: "accept",
                      bookingId: b.id,
                      termsAccepted: true,
                    });
                    router.refresh();
                  })
                }
              >
                Aceitar proposta e continuar →
              </button>
            </>
          )}
          {(b.status === "awaiting_deposit" || b.status === "confirmed") && (
            <div className="payment-action">
              {stripeReady ? (
                <>
                  <button
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() =>
                      checkout(b.status === "confirmed" ? "balance" : "deposit")
                    }
                  >
                    {b.status === "confirmed"
                      ? "Pagar saldo de teste"
                      : "Pagar sinal de teste"}{" "}
                    ·{" "}
                    {money(
                      b.status === "confirmed"
                        ? b.balanceCents
                        : b.depositCents,
                    )}{" "}
                    →
                  </button>
                  <p className="muted">
                    Você será direcionado ao ambiente de testes do Stripe. Use
                    somente cartão de teste. Ao voltar, a confirmação pode levar
                    alguns instantes.
                  </p>
                </>
              ) : (
                <p className="notice">
                  O checkout de teste ainda aguarda configuração. A equipe pode
                  simular o pagamento na agenda local para testar a confirmação.
                </p>
              )}
            </div>
          )}
          {["held", "awaiting_deposit"].includes(b.status) && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await request({ action: "cancel", bookingId: b.id });
                  router.refresh();
                })
              }
            >
              Cancelar seleção e escolher outro horário
            </button>
          )}
          {b.status === "fully_paid" && (
            <p className="notice">
              Tudo certo neste teste: proposta aceita, horário confirmado e
              pagamentos registrados.
            </p>
          )}
        </>
      )}
      {error && (
        <p className="feedback" role="alert">
          {error}
        </p>
      )}
      <button
        className="text-button"
        disabled={busy}
        onClick={() => router.refresh()}
      >
        Atualizar situação
      </button>
    </section>
  );
}
export function BookingSummary({ booking: b }: { booking: PublicBooking }) {
  return (
    <dl className="booking-summary">
      <div>
        <dt>Sua experiência</dt>
        <dd>
          {new Date(b.startAt).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            dateStyle: "long",
            timeStyle: "short",
          })}
        </dd>
        <dd>{b.locationName}</dd>
      </div>
      <div>
        <dt>Valor total</dt>
        <dd>{money(b.totalCents)}</dd>
      </div>
      <div>
        <dt>Sinal · 50%</dt>
        <dd>{money(b.depositCents)}</dd>
      </div>
      <div>
        <dt>Saldo · 50%</dt>
        <dd>{money(b.balanceCents)}</dd>
        <small>
          Até{" "}
          {new Date(b.balanceDueAt).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })}
        </small>
      </div>
      <div>
        <dt>Recebido neste teste</dt>
        <dd>{money(b.paidCents)}</dd>
      </div>
    </dl>
  );
}
export function SimulatePayment({ booking: b }: { booking: PublicBooking }) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div>
      {["awaiting_deposit", "confirmed"].includes(b.status) &&
        !b.paymentReview && (
          <button
            className="btn btn-secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const r = await fetch("/api/booking/payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    bookingId: b.id,
                    kind: b.status === "confirmed" ? "balance" : "deposit",
                    eventKey: crypto.randomUUID(),
                  }),
                });
                const d = await r.json();
                if (!r.ok) throw Error(d.error);
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy
              ? "Registrando…"
              : b.status === "confirmed"
                ? "Simular recebimento do saldo"
                : "Simular recebimento do sinal"}
          </button>
        )}
      {error && (
        <p className="feedback" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
