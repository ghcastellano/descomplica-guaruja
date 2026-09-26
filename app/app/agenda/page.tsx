import { requirePageAuth } from "@/lib/auth";
import { listBookingsForStaff } from "@/lib/booking";
import { BookingSummary, SimulatePayment } from "@/components/booking";
import { bookingLabels } from "@/lib/booking-labels";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ proposal?: string }>;
}) {
  await requirePageAuth();
  const filter = (await searchParams).proposal;
  const all = await listBookingsForStaff();
  const bookings = filter ? all.filter((b) => b.proposalId === filter) : all;
  return (
    <main>
      <a className="back" href="/">
        ← Voltar aos atendimentos
      </a>
      <span className="eyebrow">AGENDA DA NOSSA EQUIPE</span>
      <h1>Cada detalhe, no seu tempo.</h1>
      <p className="intro">
        Reservas e pagamentos no mesmo lugar. O intervalo ocupado inclui
        preparação, experiência e desmontagem.
      </p>
      <div className="notice">
        Ambiente local de teste. Os locais e horários são fictícios. As
        mensagens abaixo são registradas para conferência; nenhum WhatsApp ou
        e-mail é enviado.
      </div>
      {filter && (
        <p>
          <a className="text-link" href="/agenda">
            Ver toda a agenda
          </a>
        </p>
      )}
      <div className="agenda-list">
        {bookings.length ? (
          bookings.map((b) => (
            <article className="paper card" key={b.id}>
              <div className="section-heading">
                <span className="eyebrow">{b.protocol}</span>
                <span className="badge">{bookingLabels[b.status]}</span>
              </div>
              <h2>{b.name}</h2>
              <BookingSummary booking={b} />
              {b.paymentReview && (
                <p className="feedback">
                  Pagamento precisa de conciliação. Confira o recebimento no
                  Stripe antes de combinar novo horário ou estorno.
                </p>
              )}
              <div className="actions">
                <a
                  className="btn btn-primary"
                  href={"/propostas/" + b.proposalId}
                >
                  Abrir atendimento
                </a>
                <SimulatePayment booking={b} />
              </div>
              <details className="notification-log">
                <summary>
                  Histórico de avisos simulados ({b.notifications.length})
                </summary>
                {b.notifications.map((n, i) => (
                  <div key={i}>
                    <small>
                      {n.audience === "client" ? "Cliente" : "Sophia"} ·{" "}
                      {new Date(n.createdAt).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
                    </small>
                    <p>{n.text}</p>
                  </div>
                ))}
              </details>
            </article>
          ))
        ) : (
          <p className="empty">
            Ainda não há horários separados. Quando o cliente escolher uma
            disponibilidade no link da proposta, ela aparecerá aqui.
          </p>
        )}
      </div>
    </main>
  );
}
