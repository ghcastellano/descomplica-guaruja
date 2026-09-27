import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCityRequest } from "@/lib/city";
import { statuses } from "@/lib/city-catalog";
import { CopyLink } from "@/components/copy-link";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const r = await getPublicCityRequest((await params).token);
  if (!r) notFound();
  return (
    <main className="narrow">
      <span className="eyebrow">{r.protocol} · ACOMPANHAMENTO PRIVADO</span>
      <h1>{statuses[r.status]}.</h1>
      <p className="intro">{r.category} · cada próximo passo, por aqui.</p>
      {r.proposalPath && (
        <section className="card city-form">
          <span className="eyebrow">PRONTA PARA VOCÊ</span>
          <h2>Sua proposta foi revisada.</h2>
          <p>
            Veja os itens, o valor e as opções de agendamento no link abaixo.
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
        apenas com quem participa do pedido. Recarregue a página para ver
        atualizações.
      </div>
      <div className="form-actions">
        <CopyLink />
        <Link prefetch={false} href="/pedidos" className="text-link">
          Meus pedidos →
        </Link>
      </div>
      <p className="field-note">
        Preço, contratação e pagamento só serão confirmados em uma proposta. O
        envio deste pedido não garante disponibilidade.
      </p>
    </main>
  );
}
