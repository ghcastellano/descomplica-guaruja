import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageAuth } from "@/lib/auth";
import { getPartner, partnerProtocol } from "@/lib/partners";
import {
  partnerStatuses,
  services,
  type PartnerStatus,
} from "@/lib/service-catalog";
import { PartnerReview } from "@/components/partner-admin";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAuth();
  const p = await getPartner((await params).id);
  if (!p) notFound();
  return (
    <main className="network-page">
      <Link href="/operacao/rede" className="text-link">
        ← Rede local
      </Link>
      <header className="network-intro">
        <span className="eyebrow">
          {partnerProtocol(p.number)} ·{" "}
          {partnerStatuses[p.status as PartnerStatus]}
        </span>
        <h1>{p.name}</h1>
        <p className="intro">{p.contact}</p>
      </header>
      <section className="concierge-response">
        <h2>O que sabemos até aqui</h2>
        <dl className="request-review">
          <div>
            <dt>Origem</dt>
            <dd>{p.source}</dd>
          </div>
          {p.profile.serviceIds && (
            <>
              <div>
                <dt>Serviços</dt>
                <dd>
                  {p.profile.serviceIds
                    .map(
                      (id: string) =>
                        services.find((s) => s.id === id)?.name ||
                        "Outro serviço",
                    )
                    .join(" · ")}
                </dd>
              </div>
              <div>
                <dt>Região e disponibilidade</dt>
                <dd>
                  {p.profile.areas} · {p.profile.availability}
                </dd>
              </div>
              <div>
                <dt>Apresentação</dt>
                <dd>{p.profile.description}</dd>
              </div>
              <div>
                <dt>Autorizações atuais</dt>
                <dd>
                  Divulgação:{" "}
                  {p.profile.publishPermission
                    ? "autorizada, condicionada à ativação"
                    : "não autorizada"}
                  <br />
                  WhatsApp:{" "}
                  {p.profile.whatsappPermission
                    ? "autorizado"
                    : "não autorizado"}
                </dd>
              </div>
            </>
          )}
        </dl>
      </section>
      <PartnerReview
        key={p.version}
        id={p.id}
        version={p.version}
        status={p.status as PartnerStatus}
        url={p.url}
      />
      <section className="concierge-response">
        <h2>Histórico da avaliação</h2>
        <ol className="partner-timeline">
          {p.events.map((e) => (
            <li key={String(e.id)}>
              <strong>
                {(
                  {
                    application: "Termos e escolhas recebidos",
                    permissions: "Autorizações atualizadas",
                    ...partnerStatuses,
                  } as Record<string, string>
                )[e.kind] || e.kind}
              </strong>
              <span>
                {new Date(e.created_at).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })}{" "}
                · {e.actor}
              </span>
              {e.details.note && <p>{e.details.note}</p>}
              {e.details.termsVersion && (
                <details>
                  <summary>Comprovante do aceite de teste</summary>
                  <p>
                    Nome declarado: {e.details.name}. Identidade não validada
                    pelo formulário.
                  </p>
                  <p>Versão: {e.details.termsVersion}</p>
                  <p>
                    Divulgação: {e.details.publishPermission ? "sim" : "não"} ·
                    WhatsApp: {e.details.whatsappPermission ? "sim" : "não"}
                  </p>
                  <p className="muted">{e.details.termsText}</p>
                  <small>Integridade: {e.details.termsHash}</small>
                </details>
              )}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
