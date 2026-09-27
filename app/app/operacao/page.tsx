import { listCityRequests, cityProtocol } from "@/lib/city";
import {
  statuses,
  worlds,
  type CityStatus,
  type Vertical,
} from "@/lib/city-catalog";
import { requirePageAuth } from "@/lib/auth";
import { listRequests, packages, protocol, sources } from "@/lib/domain";
import { Logout } from "@/components/forms";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requirePageAuth();
  const params = await searchParams;
  const q = (params.q || "").trim().slice(0, 150);
  const selectedStatus = Object.hasOwn(statuses, params.status || "") ? params.status! : "";
  const [rows, cityFiltered] = await Promise.all([
    listRequests(q),
    listCityRequests(q, selectedStatus),
  ]);
  return (
    <main>
      <div className="page-top">
        <div>
          <span className="eyebrow">SUA OPERAÇÃO DESCOMPLICA</span>
          <h1>Olá, Sophia.</h1>
          <p className="intro">
            Cada conversa tem uma história.
            <br />
            Todas continuam por aqui.
          </p>
        </div>
        <div className="actions">
          <a className="btn btn-primary" href="/conversa">
            + Registrar conversa
          </a>
          <a className="btn btn-secondary" href="/solicitar">
            + Solicitação de teste
          </a>
          <Logout />
        </div>
      </div>
      <nav className="workspace-tabs" aria-label="Operação">
        <a href="/operacao" aria-current="page">
          Atendimentos
        </a>
        <a href="/agenda">Agenda e pagamentos →</a>
        <a href="/operacao/rede">Rede local →</a>
      </nav>
      <form className="contact-search" action="/operacao">
        <label>
          Buscar pedido ou atendimento
          <input type="search" name="q" defaultValue={q} maxLength={150}
            placeholder="Nome, contato ou protocolo GU / DG" />
        </label>
        <label>
          Etapa dos pedidos da nova entrada
          <select name="status" defaultValue={selectedStatus}>
            <option value="">Todas as etapas</option>
            {Object.entries(statuses).map(([key, title]) => <option key={key} value={key}>{title}</option>)}
          </select>
        </label>
        <button className="btn btn-secondary">Filtrar</button>
        {(q || selectedStatus) && <a href="/operacao" className="text-link">Limpar filtros</a>}
      </form>
      <section className="city-inbox">
        <div className="section-heading">
          <h2>Pedidos da nova entrada</h2>
          <span>{cityFiltered.length} nesta seleção</span>
        </div>
        {cityFiltered.length ? (
          <div className="inbox">
            {cityFiltered.map((r) => (
              <a
                href={"/operacao/pedidos/" + r.id}
                className="inbox-row"
                key={r.id}
              >
                <div>
                  <span className="eyebrow">
                    {cityProtocol(r.number)} ·{" "}
                    {worlds[r.vertical as Vertical].title}
                  </span>
                  <h3>{r.briefing.name}</h3>
                  <p>
                    {r.category} · {r.briefing.neighborhood}
                  </p>
                </div>
                <span className="badge">
                  {statuses[r.status as CityStatus]} →
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p>
            Nenhum pedido nesta seleção. Experimente outro termo ou limpe os filtros.
          </p>
        )}
      </section>
      <div className="summary">
        <p>
          <strong>{rows.filter((r) => r.status === "new").length}</strong> para
          completar
        </p>
        <p>
          <strong>{rows.filter((r) => r.status === "draft").length}</strong>{" "}
          para revisar
        </p>
        <p>
          <strong>{rows.filter((r) => r.status === "released").length}</strong>{" "}
          com link liberado
        </p>
      </div>

      <section>
        <div className="section-heading">
          <h2>Seus atendimentos</h2>
          <span>
            {rows.length} {q ? "encontrados" : "no total"}
          </span>
        </div>
        {rows.length ? (
          <div className="inbox">
            {rows.map((r) => (
              <a
                className="inbox-row"
                href={
                  (r.status === "new" ? "/atendimentos/" : "/propostas/") + r.id
                }
                key={r.id}
              >
                <div>
                  <span className="eyebrow">
                    {protocol(r.number)} ·{" "}
                    {sources[r.briefing.source as keyof typeof sources] ||
                      "Outro canal"}
                  </span>
                  <h3>{r.briefing.name}</h3>
                  <p>
                    {r.status === "new"
                      ? "Conversa registrada · experiência a definir"
                      : `${packages[r.briefing.packageId as keyof typeof packages].col} · ${r.briefing.guests} pessoas`}
                  </p>
                </div>
                <div>
                  <span className={"badge " + r.status}>
                    {r.status === "new"
                      ? "Completar pedido"
                      : r.status === "draft"
                        ? "Revisar proposta"
                        : "Link liberado"}
                  </span>
                  <p>
                    {r.version ? `Versão ${r.version}` : "Sem proposta"}{" "}
                    <span aria-hidden>↗</span>
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="empty">
            <span className="empty-number">01</span>
            <h2>
              {q
                ? "Nenhum atendimento encontrado."
                : "O pedido pode começar em qualquer canal."}
            </h2>
            <p>
              Registre uma conversa fictícia ou uma solicitação completa. Não é
              necessário responder ao questionário para ser atendido.
            </p>
            <a href="/conversa" className="text-link">
              Registrar conversa →
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
