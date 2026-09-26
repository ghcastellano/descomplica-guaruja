import { requirePageAuth } from "@/lib/auth";
import { listRequests, packages, protocol } from "@/lib/domain";
import { Logout } from "@/components/forms";
export default async function Page() {
  await requirePageAuth();
  const rows = await listRequests();
  return (
    <main>
      <div className="page-top">
        <div>
          <span className="eyebrow">SEU ATELIÊ DE EXPERIÊNCIAS</span>
          <h1>Olá, Sophia.</h1>
          <p className="intro">
            Cada pedido tem uma história.
            <br />
            Vamos cuidar da próxima?
          </p>
        </div>
        <div className="actions">
          <a className="btn btn-primary" href="/solicitar">
            + Solicitação de teste
          </a>
          <Logout />
        </div>
      </div>
      <div className="summary">
        <p>
          <strong>{rows.filter((r) => r.status === "draft").length}</strong>{" "}
          para revisar
        </p>
        <p>
          <strong>{rows.filter((r) => r.status === "released").length}</strong>{" "}
          com link liberado
        </p>
        <span>Fluxo de teste · nenhuma reserva confirmada</span>
      </div>
      <section>
        <div className="section-heading">
          <h2>Suas solicitações</h2>
          <span>{rows.length} no total</span>
        </div>
        {rows.length ? (
          <div className="inbox">
            {rows.map((r) => (
              <a className="inbox-row" href={"/propostas/" + r.id} key={r.id}>
                <div>
                  <span className="eyebrow">{protocol(r.number)}</span>
                  <h3>{r.briefing.name}</h3>
                  <p>
                    {
                      packages[r.briefing.packageId as keyof typeof packages]
                        .col
                    }{" "}
                    · {r.briefing.guests} pessoas
                  </p>
                </div>
                <div>
                  <span className={"badge " + r.status}>
                    {r.status === "draft"
                      ? "Revisar proposta"
                      : "Link liberado"}
                  </span>
                  <p>
                    Versão {r.version} <span aria-hidden>↗</span>
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="empty">
            <span className="empty-number">01</span>
            <h2>Comece com uma história de teste.</h2>
            <p>
              Crie uma solicitação fictícia e percorra o caminho até a proposta
              que o cliente verá.
            </p>
            <a href="/solicitar" className="text-link">
              Criar primeira solicitação →
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
