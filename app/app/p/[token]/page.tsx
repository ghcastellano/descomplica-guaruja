import { Booking } from "@/components/booking";
import { bookingContext } from "@/lib/booking";
import { getStripeMode } from "@/lib/stripe";
import { notFound } from "next/navigation";
import { clientProposal, money } from "@/lib/domain";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const token = (await params).token;
  const p = await clientProposal(token);
  if (!p) notFound();
  const context = await bookingContext(token);
  return (
    <main className="client-view">
      <span className="eyebrow">
        UMA EXPERIÊNCIA DESCOMPLICA · {p.protocol}
      </span>
      <h1>
        Um momento para
        <br />
        ficar na memória.
      </h1>
      <p className="intro">
        {p.collection} · {p.tier} · {p.guests} pessoas
      </p>
      <div className="paper card">
        <span className="eyebrow">SUA EXPERIÊNCIA</span>
        <h2>Os detalhes, cuidados.</h2>
        <ul className="included">
          {p.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <div className="price">
          <span>Valor total proposto</span>
          <strong>{money(p.amountCents)}</strong>
          <small>Para {p.guests} pessoas · proposta de teste</small>
        </div>
        <dl className="client-details">
          <div>
            <dt>Preferência de local</dt>
            <dd>
              {p.location}
              {p.place && ` · ${p.place}`}
            </dd>
          </div>
          <div>
            <dt>Período desejado</dt>
            <dd>{p.period}</dd>
          </div>
        </dl>
        {p.clientNote && <p className="client-note">{p.clientNote}</p>}
        <p className="muted">
          Versão {p.version} · Link de teste válido até{" "}
          {new Date(p.expiresAt).toLocaleDateString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })}
          .
        </p>
      </div>
      <Booking
        token={token}
        context={context}
        stripeReady={getStripeMode().ready}
      />
    </main>
  );
}
