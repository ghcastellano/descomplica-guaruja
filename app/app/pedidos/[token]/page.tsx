import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCityRequest } from "@/lib/city";
import { statuses } from "@/lib/city-catalog";
import { bookingLabels } from "@/lib/booking-labels";
import { RefreshStatus } from "@/components/refresh-status";
import { CopyLink } from "@/components/copy-link";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const r = await getPublicCityRequest((await params).token);
  if (!r) notFound();
  const bookingStatus = r.booking?.paymentReview ? "Pagamento em conferência" : r.booking ? bookingLabels[r.booking.status] : null;
  const headline = ["completed", "cancelled"].includes(r.status) ? statuses[r.status]
    : bookingStatus || (r.proposalPath ? "Proposta pronta para você" : statuses[r.status]);
  return (
    <main className="narrow">
      <span className="eyebrow">{r.protocol} · ACOMPANHAMENTO PRIVADO</span>
      <h1>{headline}.</h1>
      <p className="intro">{r.category} · cada próximo passo, por aqui.</p>
      {r.proposalPath && (
        <section className="card city-form">
          <span className="eyebrow">SUA EXPERIÊNCIA</span>
          <h2>{r.booking ? "Detalhes da sua experiência." : "Sua proposta foi revisada."}</h2>
          <p>
            {r.booking?.paymentReview ? "A equipe precisa conferir o pagamento. Não pague novamente; acompanhe pelo link abaixo." : "Confira sua proposta, a reserva e os pagamentos no link abaixo."}
          </p>
          <Link prefetch={false} href={r.proposalPath} className="btn btn-primary">
            Ver proposta e agendamento →
          </Link>
        </section>
      )}
      <ol className="request-timeline">
        {r.events.map((e) => (
          <li key={e.created_at.toISOString() + e.kind}>
            <span className="timeline-dot" />
            <div>
              <small>
                {new Date(e.created_at).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })}
              </small>
              <p>{e.public_note}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="soft-note">
        Este link dá acesso ao acompanhamento. Válido por 90 dias. Compartilhe
        apenas com quem participa do pedido. Atualize para consultar a situação mais recente.
      </div>
      <div className="form-actions">
        <RefreshStatus />
        <CopyLink />
        <Link prefetch={false} href="/pedidos" className="text-link">
          Meus pedidos →
        </Link>
      </div>
      <p className="field-note">
        {r.proposalPath ? "Os valores, itens e condições estão na proposta. Consulte o link para acompanhar cada etapa da sua reserva de teste."
          : "Preço, contratação e pagamento só serão confirmados em uma proposta. O envio deste pedido não garante disponibilidade."}
      </p>
    </main>
  );
}
