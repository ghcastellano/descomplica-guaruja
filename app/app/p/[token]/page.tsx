import { notFound } from "next/navigation";
import { clientProposal, money } from "@/lib/domain";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const p = await clientProposal((await params).token);
  if (!p) notFound();
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
        <div className="notice">
          Esta é uma proposta de demonstração. Nenhuma data ou local está
          reservado e nenhum pagamento será solicitado. Agendamento e
          confirmação serão disponibilizados em uma próxima etapa.
        </div>
        <p className="muted">
          Versão {p.version} · Link de teste válido até{" "}
          {new Date(p.expiresAt).toLocaleDateString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })}
          .
        </p>
      </div>
    </main>
  );
}
