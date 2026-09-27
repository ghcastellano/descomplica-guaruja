import { notFound } from "next/navigation";
import { publicPartner } from "@/lib/partners";
import { partnerStatuses } from "@/lib/service-catalog";
import {
  PartnerOnboarding,
  PartnerPreferences,
} from "@/components/partner-onboarding";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const p = await publicPartner(token);
  if (!p) notFound();
  const invited = ["prospect", "invited"].includes(p.status);
  return (
    <main className="network-page">
      <header className="network-intro">
        <span className="eyebrow">{p.protocol} · LINK PRIVADO</span>
        <h1>
          {invited
            ? "Vamos conhecer seu trabalho."
            : "Seu lugar na rede começa aqui."}
        </h1>
        <p className="intro">
          {invited
            ? "Você decide se quer participar. O cadastro só será enviado quando você aceitar os termos."
            : partnerStatuses[p.status]}
        </p>
      </header>
      {invited ? (
        <PartnerOnboarding token={token} version={p.version} />
      ) : (
        <section className="concierge-response">
          <h2>Acompanhamento do cadastro</h2>
          <p>
            Aprovar o pré-cadastro é uma etapa de avaliação. Ativação comercial,
            publicação e recebimento de pedidos dependem de condições
            específicas combinadas depois.
          </p>
          <ol className="partner-timeline">
            {p.events.map((e) => (
              <li key={String(e.created_at) + e.kind}>
                <strong>
                  {(
                    {
                      application: "Cadastro e escolhas registrados",
                      permissions: "Autorizações atualizadas",
                      ...partnerStatuses,
                      prospect: "Registro interno criado",
                    } as Record<string, string>
                  )[e.kind] || "Cadastro atualizado"}
                </strong>
                <span>
                  {new Date(e.created_at).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}
                </span>
                {e.terms_version && (
                  <small>
                    Termos: {e.terms_version}
                    <br />
                    Comprovante: {e.terms_hash}
                  </small>
                )}
                {e.terms_text && (
                  <details>
                    <summary>Ler os termos registrados neste aceite</summary>
                    <p style={{ whiteSpace: "pre-line" }}>{e.terms_text}</p>
                  </details>
                )}
              </li>
            ))}
          </ol>
          <PartnerPreferences
            token={token}
            version={p.version}
            status={p.status}
            publishPermission={p.publishPermission}
            whatsappPermission={p.whatsappPermission}
          />
        </section>
      )}
    </main>
  );
}
