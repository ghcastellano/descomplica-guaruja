import { serviceById } from "@/lib/service-catalog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageAuth } from "@/lib/auth";
import { getCityRequest, cityProtocol } from "@/lib/city";
import {
  worlds,
  statuses,
  type Vertical,
  type CityStatus,
} from "@/lib/city-catalog";
import { CityOperation } from "@/components/city-operation";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAuth();
  const r = await getCityRequest((await params).id);
  if (!r) notFound();
  const b = r.briefing;
  return (
    <main>
      <Link prefetch={false} className="back" href="/operacao">
        ← Todos os atendimentos
      </Link>
      <span className="eyebrow">
        {cityProtocol(r.number)} · {worlds[r.vertical as Vertical].title}
      </span>
      <h1>{b.name}</h1>
      <p className="intro">
        {r.category} · {statuses[r.status as CityStatus]}
      </p>
      <div className="intake-layout">
        <div>
          <dl className="request-review">
            <div>
              <dt>Contato informado</dt>
              <dd>{b.contact}</dd>
            </div>
            <div>
              <dt>Pedido</dt>
              <dd>{b.description}</dd>
            </div>
            <div>
              <dt>Preferências</dt>
              <dd>
                {b.neighborhood} · {b.preferredDate || "Data flexível"} ·{" "}
                {b.period}
                {b.guests ? ` · ${b.guests} pessoas` : ""}
              </dd>
            </div>
          </dl>
          {b.serviceId && (
            <section>
              <h2>{serviceById(b.serviceId)?.name}</h2>
              {serviceById(b.serviceId)?.questions.map((q, i) => (
                <p key={q}>
                  <strong>{q}</strong>
                  <br />
                  {b.serviceAnswers?.[i]}
                </p>
              ))}
            </section>
          )}
          <h2>Histórico do atendimento</h2>
          <ol className="request-timeline">
            {r.events.map((e) => (
              <li key={e.id}>
                <span className="timeline-dot" />
                <div>
                  <small>
                    {new Date(e.created_at).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}{" "}
                    · {e.actor}
                  </small>
                  <p>{e.public_note}</p>
                  {e.internal_note && (
                    <div className="soft-note">
                      <strong>Somente equipe:</strong> {e.internal_note}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <CityOperation
          id={r.id}
          version={r.version}
          status={r.status as CityStatus}
          experience={r.vertical === "experiencias"}
          linked={r.experience_request_id}
        />
      </div>
    </main>
  );
}
