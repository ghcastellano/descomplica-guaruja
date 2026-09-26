import { notFound } from "next/navigation";
import { requirePageAuth } from "@/lib/auth";
import {
  getProposal,
  protocol,
  packages,
  locations,
  periods,
  money,
  type Briefing,
  type Revision,
} from "@/lib/domain";
import { Review, CopyMessage } from "@/components/forms";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAuth();
  const p = await getProposal((await params).id);
  if (!p) notFound();
  const b = p.briefing as Briefing;
  const titles: Record<string, string> = {
    created: "Solicitação recebida e rascunho criado",
    revised: "Proposta revisada; links anteriores cancelados",
    released: "Versão aprovada e mensagem simulada preparada",
  };
  return (
    <main>
      <a className="back" href="/">
        ← Solicitações
      </a>
      <span className="eyebrow">
        {protocol(p.number)} · VERSÃO {p.version}
      </span>
      <h1>{b.name}</h1>
      <p className="intro">
        {packages[b.packageId].col} · {packages[b.packageId].tier} · {b.guests}{" "}
        pessoas{" "}
        <span className={"badge " + p.status}>
          {p.status === "draft" ? "Para revisar" : "Link liberado"}
        </span>
      </p>
      <div className="workspace">
        <aside>
          <div className="paper card brief">
            <div className="section-title">
              <span>01</span>
              <h2>O pedido</h2>
            </div>
            <dl>
              <dt>Contato de teste</dt>
              <dd>{b.contact}</dd>
              <dt>Preferência</dt>
              <dd>
                {locations[b.location]}
                {b.place && ` · ${b.place}`}
              </dd>
              <dt>Período</dt>
              <dd>{periods[b.period]}</dd>
              <dt>Expectativa de orçamento</dt>
              <dd>{money(b.budget * 100)}</dd>
              <dt>História e cuidados</dt>
              <dd>{b.notes || "Nenhum detalhe adicional."}</dd>
            </dl>
            <div className="notice">
              Data e local não estão reservados. A agenda será implementada na
              próxima etapa.
            </div>
          </div>
          <section className="history">
            <h2>Rastro da proposta</h2>
            <ol>
              {p.events.map((e, i) => (
                <li key={i}>
                  <strong>{titles[e.kind] || e.kind}</strong>
                  <small>
                    Versão {e.details.version} ·{" "}
                    {new Date(e.created_at).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}
                  </small>
                  <small>{e.actor}</small>
                </li>
              ))}
            </ol>
            <h2>Versões salvas</h2>
            {p.revisions.map((r) => (
              <details className="revision-history" key={r.version}>
                <summary>
                  Versão {r.version} · {money(r.snapshot.amountCents)}
                </summary>
                <ul>
                  {r.snapshot.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <p>
                  <strong>Recado ao cliente</strong>
                  <br />
                  {r.snapshot.clientNote || "Sem recado."}
                </p>
                <p>
                  <strong>Nota interna</strong>
                  <br />
                  {r.snapshot.internalNote || "Sem nota."}
                </p>
              </details>
            ))}
          </section>
        </aside>
        <div>
          <Review
            key={p.version + ":" + p.status}
            id={p.id}
            version={p.version}
            status={p.status}
            revision={p.snapshot as Revision}
          />
          {p.message && (
            <section className="message">
              <span className="eyebrow">WHATSAPP · SIMULAÇÃO</span>
              <h2>O próximo contato, preparado.</h2>
              <p>Este texto está registrado. Nada foi enviado.</p>
              <pre>{p.message.text}</pre>
              <div className="actions">
                <a
                  className="btn btn-primary"
                  href={p.message.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir visão do cliente ↗
                </a>
                <CopyMessage text={p.message.text} />
              </div>
              <small>
                Link local válido por 7 dias. Editar a proposta cancela este
                link.
              </small>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
